"""S01 · Un solo participante registrado (Cardinal R018; OCP "Single bid received").

A process of a competitive method with exactly one registered participant
(``numero_postores = 1``; the source has no bids) merits review. Direct contracting, other
non-competitive methods and doubtful methods are left out. With ``solo_con_adjudicacion``, only
processes with at least one award are evaluated, because a deserted process has no contract to
review. Processes that are not evaluated are counted. See docs/datos/catalogo-de-senales.md.
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
    con.execute(
        """
        CREATE OR REPLACE TEMP TABLE s01_casos AS
        SELECT c.*,
               c.ocid IN (SELECT ocid FROM adjudicaciones) AS con_adjudicacion,
               list_contains(CAST($doubtful AS VARCHAR[]), c.metodo_base) AS dudoso
        FROM casos_region c
        """,
        {"doubtful": list(settings.methods.doubtful)},
    )
    excluded, no_buyer, doubtful, unclassified, no_data, no_award = con.execute(
        f"""
        SELECT count(*) FILTER (WHERE excluido),
               count(*) FILTER (WHERE NOT excluido AND entidad_id IS NULL),
               count(*) FILTER (WHERE {ELIGIBLE_SQL} AND dudoso),
               count(*) FILTER (WHERE {ELIGIBLE_SQL} AND competitivo IS NULL AND NOT dudoso),
               count(*) FILTER (WHERE {ELIGIBLE_SQL} AND competitivo AND numero_postores IS NULL),
               count(*) FILTER (WHERE {ELIGIBLE_SQL} AND competitivo
                                  AND numero_postores IS NOT NULL
                                  AND $awarded_only AND NOT con_adjudicacion)
        FROM s01_casos
        """,
        {"awarded_only": settings.s01.awarded_only},
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
        FROM s01_casos c
        JOIN comparacion_s01 k USING (ocid)
        WHERE {ELIGIBLE_SQL} AND c.competitivo AND c.numero_postores = 1
          AND (NOT $awarded_only OR c.con_adjudicacion)
        """,
        {
            "unit": settings.s01.unit,
            "threshold": settings.s01.threshold_description,
            "version": settings.s01.switch.rule_version,
            "awarded_only": settings.s01.awarded_only,
        },
    )
    return [
        {"codigo": CODE, "motivo": "proceso en estado excluido", "cantidad": excluded},
        {"codigo": CODE, "motivo": "sin comprador", "cantidad": no_buyer},
        {"codigo": CODE, "motivo": "método dudoso (sin señal)", "cantidad": doubtful},
        {"codigo": CODE, "motivo": "método sin clasificar", "cantidad": unclassified},
        {"codigo": CODE, "motivo": "sin dato de postores", "cantidad": no_data},
        {"codigo": CODE, "motivo": "proceso sin adjudicación", "cantidad": no_award},
    ]
