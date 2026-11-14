"""S01 · Oferta única (Cardinal R018; OCP "Single bid received").

A process of a competitive method with exactly one tenderer (``numero_postores = 1``) merits
review. Direct contracting and other non-competitive methods are left out. A process without
the number of tenderers is not evaluated and is counted. See docs/datos/catalogo-de-senales.md.
"""

from __future__ import annotations

from typing import Any

import duckdb

from pipeline.signals.context import RuleContext
from pipeline.signals.groups import build_comparison
from pipeline.signals.settings import SignalsConfig

CODE = "S01"
ELIGIBLE_SQL = "NOT excluido AND entidad_id IS NOT NULL"


def compute(
    con: duckdb.DuckDBPyConnection, settings: SignalsConfig, context: RuleContext
) -> list[dict[str, Any]]:
    """Insert the S01 results into ``senales`` and return the counted exclusions."""
    excluded, no_buyer, unclassified, no_data = con.execute(
        f"""
        SELECT count(*) FILTER (WHERE excluido),
               count(*) FILTER (WHERE NOT excluido AND entidad_id IS NULL),
               count(*) FILTER (WHERE {ELIGIBLE_SQL} AND competitivo IS NULL),
               count(*) FILTER (WHERE {ELIGIBLE_SQL} AND competitivo AND numero_postores IS NULL)
        FROM casos_region
        """
    ).fetchone()

    build_comparison(
        con,
        "comparacion_s01",
        measure_sql="numero_postores",
        population_sql="NOT excluido AND competitivo AND numero_postores IS NOT NULL",
        minimum_group=settings.minimum_group,
        region_label=context.region_label,
        share_of_two_or_more=True,
    )
    con.execute(
        f"""
        INSERT INTO senales BY NAME
        SELECT 'S01-' || c.ocid AS id,
               'S01' AS codigo,
               'competencia' AS categoria,
               'proceso' AS nivel,
               c.entidad_id,
               {{'tipo': 'proceso', 'id': c.ocid}} AS objeto,
               [c.ocid] AS ocids,
               CAST(c.numero_postores AS DOUBLE) AS valor,
               $unit AS unidad,
               {{'operador': 'igual', 'valor': 1.0, 'descripcion': $threshold}} AS umbral,
               k.comparacion,
               {{'cardinal': 'R018', 'ocp': 'Single bid received'}} AS referencia,
               $version AS version_regla,
               to_json({{'numero_postores': c.numero_postores, 'metodo': c.metodo}}) AS entradas,
               CAST([] AS VARCHAR[]) AS calidad,
               false AS simulado
        FROM casos_region c
        JOIN comparacion_s01 k USING (ocid)
        WHERE {ELIGIBLE_SQL} AND c.competitivo AND c.numero_postores = 1
        """,
        {
            "unit": settings.s01.unit,
            "threshold": settings.s01.threshold_description,
            "version": settings.s01.switch.rule_version,
        },
    )
    return [
        {"codigo": CODE, "motivo": "proceso en estado excluido", "cantidad": excluded},
        {"codigo": CODE, "motivo": "sin comprador", "cantidad": no_buyer},
        {"codigo": CODE, "motivo": "método sin clasificar", "cantidad": unclassified},
        {"codigo": CODE, "motivo": "sin dato de postores", "cantidad": no_data},
    ]
