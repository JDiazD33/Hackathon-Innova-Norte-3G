"""S03 · Proveedor recurrente atípico en una entidad (OCP red flags guide; Arachne concentration).

In the window of ``ventana_meses`` months that ends on the data cut date, a supplier's share of an
entity's awarded processes, or of its awarded amount, merits review when it is above the Tukey
upper fence (Q3 + ``factor_tukey`` × IQR) of the shares of that entity's suppliers, and the
supplier won at least ``minimo_adjudicaciones`` processes there. Every process the supplier won
in the window inherits the signal through ``ocids``. See docs/datos/catalogo-de-senales.md.
"""

from __future__ import annotations

import calendar
from datetime import date, timedelta
from typing import Any

import duckdb

from pipeline.signals.context import RuleContext
from pipeline.signals.settings import SignalsConfig

CODE = "S03"


def months_before(day: date, months: int) -> date:
    """The same day ``months`` months earlier (or the month's last day if it is shorter)."""
    index = day.year * 12 + day.month - 1 - months
    year, month = divmod(index, 12)
    return date(year, month + 1, min(day.day, calendar.monthrange(year, month + 1)[1]))


def window(cut_date: date, months: int) -> tuple[date, date]:
    """First and last day of the window of ``months`` months that ends on ``cut_date``."""
    return months_before(cut_date, months) + timedelta(days=1), cut_date


def compute(
    con: duckdb.DuckDBPyConnection, settings: SignalsConfig, context: RuleContext
) -> list[dict[str, Any]]:
    """Insert the S03 results into ``senales`` and return the counted exclusions."""
    start, end = window(context.cut_date, settings.s03.window_months)
    con.execute(
        """
        CREATE OR REPLACE TEMP TABLE s03_adjudicaciones AS
        SELECT a.ocid, a.proveedor_id, a.fecha_adjudicacion, a.monto, c.entidad_id, c.excluido,
               CASE WHEN a.moneda = 'PEN' THEN a.monto
                    WHEN a.moneda = c.moneda AND c.monto_referencial > 0
                         AND c.monto_referencial_pen IS NOT NULL
                    THEN a.monto * c.monto_referencial_pen / c.monto_referencial
               END AS monto_pen,
               a.fecha_adjudicacion BETWEEN $start AND $end AS en_ventana
        FROM adjudicaciones a
        JOIN casos_region c USING (ocid)
        """,
        {"start": start, "end": end},
    )
    eligible = "NOT excluido AND entidad_id IS NOT NULL"
    excluded, no_buyer, no_supplier, no_date, outside, no_amount = con.execute(
        f"""
        SELECT count(*) FILTER (WHERE excluido),
               count(*) FILTER (WHERE NOT excluido AND entidad_id IS NULL),
               count(*) FILTER (WHERE {eligible} AND proveedor_id IS NULL),
               count(*) FILTER (WHERE {eligible} AND proveedor_id IS NOT NULL
                                  AND fecha_adjudicacion IS NULL),
               count(*) FILTER (WHERE {eligible} AND proveedor_id IS NOT NULL AND NOT en_ventana),
               count(*) FILTER (WHERE {eligible} AND proveedor_id IS NOT NULL AND en_ventana
                                  AND monto_pen IS NULL)
        FROM s03_adjudicaciones
        """
    ).fetchone()

    con.execute(
        f"""
        CREATE OR REPLACE TEMP TABLE s03_participaciones AS
        WITH base AS (
            SELECT * FROM s03_adjudicaciones
            WHERE {eligible} AND proveedor_id IS NOT NULL AND en_ventana
        ),
        proveedor AS (
            SELECT entidad_id, proveedor_id,
                   count(DISTINCT ocid) AS procesos,
                   sum(monto_pen) AS monto,
                   count(*) FILTER (WHERE monto_pen IS NULL) AS sin_monto,
                   list_sort(list_distinct(list(ocid))) AS ocids
            FROM base
            GROUP BY ALL
        ),
        entidad AS (
            SELECT entidad_id, count(DISTINCT ocid) AS procesos_entidad,
                   sum(monto_pen) AS monto_entidad
            FROM base
            GROUP BY entidad_id
        )
        SELECT p.*, e.procesos_entidad, e.monto_entidad,
               p.procesos / e.procesos_entidad AS part_procesos,
               CASE WHEN e.monto_entidad > 0 THEN coalesce(p.monto, 0) / e.monto_entidad
               END AS part_monto
        FROM proveedor p
        JOIN entidad e USING (entidad_id)
        """
    )
    con.execute(
        """
        CREATE OR REPLACE TEMP TABLE s03_candidatos AS
        WITH vallas AS (
            SELECT entidad_id,
                   count(*) AS proveedores,
                   quantile_cont(part_procesos, 0.25) AS q1_procesos,
                   quantile_cont(part_procesos, 0.5) AS mediana_procesos,
                   quantile_cont(part_procesos, 0.75) AS q3_procesos,
                   quantile_cont(part_monto, 0.25) AS q1_monto,
                   quantile_cont(part_monto, 0.5) AS mediana_monto,
                   quantile_cont(part_monto, 0.75) AS q3_monto,
                   list(part_procesos) AS valores_procesos,
                   list(part_monto) FILTER (WHERE part_monto IS NOT NULL) AS valores_monto
            FROM s03_participaciones
            GROUP BY entidad_id
        ),
        marcados AS (
            SELECT p.*, v.*,
                   v.q3_procesos + $factor * (v.q3_procesos - v.q1_procesos) AS valla_procesos,
                   v.q3_monto + $factor * (v.q3_monto - v.q1_monto) AS valla_monto
            FROM s03_participaciones p
            JOIN vallas v USING (entidad_id)
            WHERE p.procesos >= $minimum
        )
        SELECT *,
               coalesce(part_monto > valla_monto, false) AS por_monto,
               part_procesos > valla_procesos AS por_procesos
        FROM marcados
        WHERE coalesce(part_monto > valla_monto, false) OR part_procesos > valla_procesos
        """,
        {"factor": settings.tukey_factor, "minimum": settings.s03.minimum_awards},
    )
    con.execute(
        """
        INSERT INTO senales BY NAME
        WITH k AS (
            SELECT *,
                   CASE WHEN por_monto THEN part_monto ELSE part_procesos END AS medida,
                   CASE WHEN por_monto THEN valla_monto ELSE valla_procesos END AS valla,
                   CASE WHEN por_monto THEN valores_monto ELSE valores_procesos END AS valores,
                   CASE WHEN por_monto THEN q1_monto ELSE q1_procesos END AS q1,
                   CASE WHEN por_monto THEN mediana_monto ELSE mediana_procesos END AS mediana,
                   CASE WHEN por_monto THEN q3_monto ELSE q3_procesos END AS q3
            FROM s03_candidatos
        )
        SELECT 'S03-' || proveedor_id || '-' || entidad_id AS id,
               'S03' AS codigo,
               'concentracion' AS categoria,
               'proveedor_entidad' AS nivel,
               entidad_id,
               {'tipo': 'proveedor', 'id': proveedor_id} AS objeto,
               ocids,
               round(medida, 4) AS valor,
               CASE WHEN por_monto THEN 'participación en el monto adjudicado'
                    ELSE 'participación en los procesos adjudicados' END AS unidad,
               {'operador': 'mayor_que', 'valor': round(valla, 4),
                'descripcion': $threshold} AS umbral,
               {'descripcion': 'Proveedores de la entidad con adjudicaciones entre '
                               || strftime($start, '%Y-%m-%d') || ' y '
                               || strftime($end, '%Y-%m-%d'),
                'ambito': 'region',
                'n': proveedores,
                'q1': round(q1, 4),
                'mediana': round(mediana, 4),
                'q3': round(q3, 4),
                'valla_superior': round(valla, 4),
                'percentil_del_caso': round(
                    100.0 * len(list_filter(valores, lambda x: x <= medida)) / len(valores), 2),
                'proporcion_referencia': NULL::DOUBLE} AS comparacion,
               {'cardinal': NULL::VARCHAR, 'ocp': NULL::VARCHAR} AS referencia,
               $version AS version_regla,
               to_json({'proveedor_id': proveedor_id,
                        'procesos_ganados': procesos,
                        'procesos_entidad': procesos_entidad,
                        'monto_proveedor_pen': round(monto, 2),
                        'monto_entidad_pen': round(monto_entidad, 2),
                        'participacion_procesos': round(part_procesos, 4),
                        'participacion_monto': round(part_monto, 4),
                        'medida': CASE WHEN por_monto THEN 'monto' ELSE 'procesos' END,
                        'ventana_inicio': strftime($start, '%Y-%m-%d'),
                        'ventana_fin': strftime($end, '%Y-%m-%d')}) AS entradas,
               CASE WHEN sin_monto > 0
                    THEN ['hay adjudicaciones sin monto en soles: no suman al monto']
                    ELSE CAST([] AS VARCHAR[]) END AS calidad,
               false AS simulado
        FROM k
        """,
        {
            "threshold": f"valla superior de Tukey (Q3 + {settings.tukey_factor:g} × RIC) "
            "de los proveedores de la entidad",
            "version": settings.s03.switch.rule_version,
            "start": start,
            "end": end,
        },
    )
    return [
        {"codigo": CODE, "motivo": "proceso en estado excluido", "cantidad": excluded},
        {"codigo": CODE, "motivo": "sin comprador", "cantidad": no_buyer},
        {"codigo": CODE, "motivo": "adjudicación sin proveedor", "cantidad": no_supplier},
        {"codigo": CODE, "motivo": "adjudicación sin fecha", "cantidad": no_date},
        {"codigo": CODE, "motivo": "adjudicación fuera de la ventana", "cantidad": outside},
        {"codigo": CODE, "motivo": "adjudicación sin monto en soles", "cantidad": no_amount},
    ]
