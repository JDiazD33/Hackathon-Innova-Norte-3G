"""S02 · Plazo corto para presentar ofertas (Cardinal R003; OCP "Short submission period").

A process whose period, in calendar days, is below the configured percentile of its comparison
group merits review. The period columns are configurable; the source has no real submission
period (``tender.tenderPeriod`` starts and ends on the call date), so the signal ships
deactivated. See docs/datos/catalogo-de-senales.md.
"""

from __future__ import annotations

from typing import Any

import duckdb

from pipeline.signals.context import RuleContext
from pipeline.signals.groups import build_comparison
from pipeline.signals.settings import PERIOD_COLUMNS, SignalsConfig

CODE = "S02"
ELIGIBLE_SQL = "NOT excluido AND entidad_id IS NOT NULL"


def compute(
    con: duckdb.DuckDBPyConnection, settings: SignalsConfig, context: RuleContext
) -> list[dict[str, Any]]:
    """Insert the S02 results into ``senales`` and return the counted exclusions."""
    start, end = settings.s02.start_column, settings.s02.end_column
    if start not in PERIOD_COLUMNS or end not in PERIOD_COLUMNS:  # validated on load, kept safe
        raise ValueError(f"Columnas de plazo no permitidas: {start}, {end}")
    has_period = f"{start} IS NOT NULL AND {end} IS NOT NULL"
    excluded, no_buyer, no_data, invalid = con.execute(
        f"""
        SELECT count(*) FILTER (WHERE excluido),
               count(*) FILTER (WHERE NOT excluido AND entidad_id IS NULL),
               count(*) FILTER (WHERE {ELIGIBLE_SQL} AND NOT ({has_period})),
               count(*) FILTER (WHERE {ELIGIBLE_SQL} AND {has_period} AND {end} < {start})
        FROM casos_region
        """
    ).fetchone()

    percentile = settings.s02.percentile
    build_comparison(
        con,
        "comparacion_s02",
        measure_sql=f"date_diff('day', {start}, {end})",
        population_sql=f"NOT excluido AND {has_period} AND {end} >= {start}",
        minimum_group=settings.minimum_group,
        region_label=context.region_label,
        percentile=percentile / 100,
    )
    con.execute(
        f"""
        INSERT INTO senales BY NAME
        SELECT 'S02-' || c.ocid AS id,
               'S02' AS codigo,
               'tiempos' AS categoria,
               'proceso' AS nivel,
               c.entidad_id,
               {{'tipo': 'proceso', 'id': c.ocid}} AS objeto,
               [c.ocid] AS ocids,
               k.valor AS valor,
               'días' AS unidad,
               {{'operador': 'menor_que', 'valor': round(k.percentil_valor, 4),
                 'descripcion': $threshold}} AS umbral,
               k.comparacion,
               {{'cardinal': 'R003', 'ocp': 'Short submission period'}} AS referencia,
               $version AS version_regla,
               to_json({{'dias': k.valor, 'inicio': c.{start}, 'fin': c.{end},
                         'metodo': c.metodo}}) AS entradas,
               CAST([] AS VARCHAR[]) AS calidad,
               false AS simulado
        FROM casos_region c
        JOIN comparacion_s02 k USING (ocid)
        WHERE {ELIGIBLE_SQL} AND k.valor < k.percentil_valor
        """,
        {
            "threshold": f"por debajo del percentil {percentile:g} de su grupo",
            "version": settings.s02.switch.rule_version,
        },
    )
    return [
        {"codigo": CODE, "motivo": "proceso en estado excluido", "cantidad": excluded},
        {"codigo": CODE, "motivo": "sin comprador", "cantidad": no_buyer},
        {"codigo": CODE, "motivo": "sin dato de plazo", "cantidad": no_data},
        {"codigo": CODE, "motivo": "plazo con fin anterior al inicio", "cantidad": invalid},
    ]
