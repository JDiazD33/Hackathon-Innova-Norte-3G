"""S04 · Compras similares cercanas en el tiempo (possible splitting; OCP guide, challenge 2).

Two or more processes of the same entity, the same item class (the first
``digitos_clasificacion`` UNSPSC digits), the same less demanding method and the same kind of
purchase, called within ``ventana_dias`` days of each other, whose reference amounts add up to
more than the threshold of the superior method, merit review. The thresholds come from
``S04.umbrales`` with the norm cited; a method without a threshold for that kind of purchase and
year is not evaluated. Each process of the group inherits the signal through ``ocids``.
See docs/datos/catalogo-de-senales.md.
"""

from __future__ import annotations

from typing import Any

import duckdb

from pipeline.signals.context import RuleContext
from pipeline.signals.settings import SignalsConfig

CODE = "S04"


def compute(
    con: duckdb.DuckDBPyConnection, settings: SignalsConfig, context: RuleContext
) -> list[dict[str, Any]]:
    """Insert the S04 results into ``senales`` and return the counted exclusions."""
    s04 = settings.s04
    con.execute(
        """
        CREATE OR REPLACE TEMP TABLE umbrales_s04 (
            metodo VARCHAR, categoria VARCHAR, anio BIGINT, umbral_pen DOUBLE, norma VARCHAR)
        """
    )
    if s04.thresholds:
        con.executemany(
            "INSERT INTO umbrales_s04 VALUES (?, ?, ?, ?, ?)",
            [(t.method, t.category, t.year, t.amount_pen, t.norm) for t in s04.thresholds],
        )
    digits = {"digits": s04.classification_digits}
    con.execute(
        """
        CREATE OR REPLACE TEMP TABLE s04_evaluables AS
        SELECT c.ocid, c.entidad_id, c.excluido, c.metodo_base, c.categoria,
               c.anio_convocatoria AS anio, c.fecha_convocatoria AS fecha,
               c.monto_referencial_pen AS monto, u.umbral_pen, u.norma,
               (SELECT list_sort(list_distinct(list(left(i.unspsc, $digits))))
                FROM items i
                WHERE i.ocid = c.ocid AND length(i.unspsc) >= $digits) AS clases
        FROM casos_region c
        JOIN umbrales_s04 u
          ON u.metodo = c.metodo_base AND u.categoria = c.categoria
         AND u.anio = c.anio_convocatoria
        """,
        digits,
    )
    eligible = "NOT excluido AND entidad_id IS NOT NULL"
    excluded, no_buyer, no_amount, no_class = con.execute(
        f"""
        SELECT count(*) FILTER (WHERE excluido),
               count(*) FILTER (WHERE NOT excluido AND entidad_id IS NULL),
               count(*) FILTER (WHERE {eligible} AND coalesce(monto, 0) <= 0),
               count(*) FILTER (WHERE {eligible} AND monto > 0 AND coalesce(len(clases), 0) = 0)
        FROM s04_evaluables
        """
    ).fetchone()

    con.execute(
        f"""
        CREATE OR REPLACE TEMP TABLE s04_grupos AS
        WITH k AS (
            SELECT ocid, entidad_id, metodo_base, categoria, anio, fecha, monto, umbral_pen,
                   norma, unnest(clases) AS clase
            FROM s04_evaluables
            WHERE {eligible} AND monto > 0 AND fecha IS NOT NULL
        ),
        grupos AS (
            SELECT a.ocid AS ancla, a.entidad_id, a.clase, a.metodo_base, a.categoria, a.anio,
                   a.umbral_pen, a.norma,
                   list(b.ocid ORDER BY b.fecha, b.ocid) AS ocids,
                   list(strftime(b.fecha, '%Y-%m-%d') ORDER BY b.fecha, b.ocid) AS fechas,
                   list(round(b.monto, 2) ORDER BY b.fecha, b.ocid) AS montos,
                   count(*) AS procesos,
                   sum(b.monto) AS suma
            FROM k a
            JOIN k b
              ON b.entidad_id = a.entidad_id AND b.clase = a.clase
             AND b.metodo_base = a.metodo_base AND b.categoria = a.categoria
             AND b.fecha BETWEEN a.fecha AND a.fecha + $window
             AND (b.fecha > a.fecha OR b.ocid >= a.ocid)
            GROUP BY ALL
        ),
        calificados AS (SELECT * FROM grupos WHERE procesos >= 2 AND suma > umbral_pen)
        SELECT g.*
        FROM calificados g
        WHERE NOT EXISTS (
            SELECT 1 FROM calificados h
            WHERE h.entidad_id = g.entidad_id AND h.clase = g.clase
              AND h.metodo_base = g.metodo_base AND h.categoria = g.categoria
              AND h.ancla <> g.ancla AND len(h.ocids) > len(g.ocids)
              AND list_has_all(h.ocids, g.ocids)
        )
        """,
        {"window": s04.window_days},
    )
    con.execute(
        """
        INSERT INTO senales BY NAME
        SELECT 'S04-' || ancla || '-' || clase AS id,
               'S04' AS codigo,
               'fraccionamiento' AS categoria,
               'grupo' AS nivel,
               entidad_id,
               {'tipo': 'grupo', 'id': ancla || '-' || clase} AS objeto,
               ocids,
               round(suma, 2) AS valor,
               'soles' AS unidad,
               {'operador': 'mayor_que', 'valor': umbral_pen,
                'descripcion': 'umbral del método superior a ' || metodo_base
                               || ' (' || norma || ')'} AS umbral,
               NULL AS comparacion,
               {'cardinal': NULL::VARCHAR, 'ocp': NULL::VARCHAR} AS referencia,
               $version AS version_regla,
               to_json({'clase': clase,
                        'metodo': metodo_base,
                        'categoria': categoria,
                        'anio': anio,
                        'procesos': procesos,
                        'suma_pen': round(suma, 2),
                        'umbral_pen': umbral_pen,
                        'ventana_dias': $window,
                        'norma': norma,
                        'fechas': fechas,
                        'montos': montos}) AS entradas,
               CAST([] AS VARCHAR[]) AS calidad,
               false AS simulado
        FROM s04_grupos
        """,
        {"version": s04.switch.rule_version, "window": s04.window_days},
    )
    return [
        {"codigo": CODE, "motivo": "proceso en estado excluido", "cantidad": excluded},
        {"codigo": CODE, "motivo": "sin comprador", "cantidad": no_buyer},
        {"codigo": CODE, "motivo": "sin monto en soles", "cantidad": no_amount},
        {"codigo": CODE, "motivo": "sin clasificación UNSPSC", "cantidad": no_class},
    ]
