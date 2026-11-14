"""S06 · Monto final mayor que el contratado (OCP red flags guide).

A contract merits review when its final amount (``contracts[].implementation.finalValue``) is at
least ``factor`` times the contracted amount, in the same currency. The final amount comes only
in some contracts: when fewer than ``cobertura_minima`` of them have it, the signal is not
computed and the manifest records why. See docs/datos/catalogo-de-senales.md.
"""

from __future__ import annotations

from typing import Any

import duckdb

from pipeline.signals.context import RuleContext, SignalUnavailable
from pipeline.signals.settings import SignalsConfig

CODE = "S06"


def percent(value: float) -> str:
    """0.0913 -> '9.1%', in the es-PE format that the web uses for every number."""
    text = f"{value * 100:.1f}"
    return (text[:-2] if text.endswith(".0") else text) + "%"


def compute(
    con: duckdb.DuckDBPyConnection, settings: SignalsConfig, context: RuleContext
) -> list[dict[str, Any]]:
    """Insert the S06 results into ``senales`` and return the counted exclusions."""
    s06 = settings.s06
    total, with_final = con.execute(
        """
        SELECT count(*), count(k.monto_final)
        FROM contratos k JOIN casos_region c USING (ocid)
        WHERE NOT c.excluido
        """
    ).fetchone()
    coverage = with_final / total if total else 0.0
    if coverage < s06.minimum_coverage:
        raise SignalUnavailable(
            f"Solo el {percent(coverage)} de los contratos de {context.region_label} tiene monto "
            f"final (contracts[].implementation.finalValue); el mínimo es "
            f"{percent(s06.minimum_coverage)}."
        )

    excluded, no_buyer, no_final, no_amount, other_currency = con.execute(
        """
        SELECT count(*) FILTER (WHERE c.excluido),
               count(*) FILTER (WHERE NOT c.excluido AND c.entidad_id IS NULL),
               count(*) FILTER (WHERE NOT c.excluido AND c.entidad_id IS NOT NULL
                                  AND k.monto_final IS NULL),
               count(*) FILTER (WHERE NOT c.excluido AND c.entidad_id IS NOT NULL
                                  AND k.monto_final IS NOT NULL
                                  AND coalesce(k.monto <= 0, true)),
               count(*) FILTER (WHERE NOT c.excluido AND c.entidad_id IS NOT NULL
                                  AND k.monto_final IS NOT NULL AND k.monto > 0
                                  AND k.moneda_monto_final IS DISTINCT FROM k.moneda)
        FROM contratos k JOIN casos_region c USING (ocid)
        """
    ).fetchone()
    con.execute(
        """
        INSERT INTO senales BY NAME
        SELECT 'S06-' || k.ocid || '-' || coalesce(k.contrato_id, 'contrato') AS id,
               'S06' AS codigo,
               'ejecucion' AS categoria,
               'proceso' AS nivel,
               c.entidad_id,
               {'tipo': 'proceso', 'id': k.ocid} AS objeto,
               [k.ocid] AS ocids,
               round(k.monto_final / k.monto, 4) AS valor,
               'veces el monto contratado' AS unidad,
               {'operador': 'mayor_o_igual', 'valor': $factor,
                'descripcion': $threshold} AS umbral,
               NULL AS comparacion,
               {'cardinal': NULL::VARCHAR, 'ocp': NULL::VARCHAR} AS referencia,
               $version AS version_regla,
               to_json({'contrato_id': k.contrato_id,
                        'monto_contratado': k.monto,
                        'monto_final': k.monto_final,
                        'moneda': k.moneda,
                        'cobertura_monto_final': round($coverage, 4)}) AS entradas,
               CAST([] AS VARCHAR[]) AS calidad,
               false AS simulado
        FROM contratos k JOIN casos_region c USING (ocid)
        WHERE NOT c.excluido AND c.entidad_id IS NOT NULL
          AND k.monto > 0 AND k.monto_final IS NOT NULL
          AND k.moneda_monto_final IS NOT DISTINCT FROM k.moneda
          AND k.monto_final >= $factor * k.monto
        """,
        {
            "factor": s06.factor,
            "threshold": f"monto final de {s06.factor:g} veces el monto contratado o más",
            "version": s06.switch.rule_version,
            "coverage": coverage,
        },
    )
    return [
        {"codigo": CODE, "motivo": "proceso en estado excluido", "cantidad": excluded},
        {"codigo": CODE, "motivo": "sin comprador", "cantidad": no_buyer},
        {"codigo": CODE, "motivo": "contrato sin monto final", "cantidad": no_final},
        {"codigo": CODE, "motivo": "contrato sin monto contratado", "cantidad": no_amount},
        {"codigo": CODE, "motivo": "monto final en otra moneda", "cantidad": other_currency},
    ]
