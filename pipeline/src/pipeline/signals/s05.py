"""S05 · Uso atípico de contratación directa (OCP red flags guide).

An entity merits review when its share of direct contracting, in processes or in reference
amount, is above the Tukey upper fence (Q3 + ``factor_tukey`` × IQR) of the entities of its type
(universidad, municipalidad, gobierno regional or otro; see pipeline/entities.py), and it used
direct contracting at least ``minimo_directas`` times. The group is the region's entities of that
type, or the whole country's when the region has fewer than ``minimo_grupo``. Only entities with
at least ``minimo_procesos`` processes are evaluated or enter a group. The signal belongs to the
entity panel and adds to no process priority. See docs/datos/catalogo-de-senales.md.
"""

from __future__ import annotations

from typing import Any

import duckdb

from pipeline.entities import GROUP_LABELS, entity_type_sql
from pipeline.signals.context import RuleContext
from pipeline.signals.settings import SignalsConfig

CODE = "S05"
VALID_SQL = "NOT c.excluido AND c.entidad_id IS NOT NULL AND c.metodo_base IS NOT NULL"
GROUP_LABEL_SQL = (
    "CASE tipo " + " ".join(f"WHEN '{k}' THEN '{v}'" for k, v in GROUP_LABELS.items()) + " END"
)


def compute(
    con: duckdb.DuckDBPyConnection, settings: SignalsConfig, context: RuleContext
) -> list[dict[str, Any]]:
    """Insert the S05 results into ``senales`` and return the counted exclusions."""
    s05 = settings.s05
    excluded, no_buyer, no_method = con.execute(
        """
        SELECT count(*) FILTER (WHERE excluido),
               count(*) FILTER (WHERE NOT excluido AND entidad_id IS NULL),
               count(*) FILTER (WHERE NOT excluido AND entidad_id IS NOT NULL
                                  AND metodo_base IS NULL)
        FROM casos_region
        """
    ).fetchone()
    con.execute(
        f"""
        CREATE OR REPLACE TEMP TABLE s05_entidades AS
        WITH casos AS (
            SELECT 'region' AS origen, c.ocid, c.entidad_id, e.nombre AS entidad_nombre,
                   c.fecha_convocatoria, c.metodo_base, c.monto_referencial_pen
            FROM casos_region c LEFT JOIN entidades e ON e.entidad_id = c.entidad_id
            WHERE {VALID_SQL}
            UNION ALL
            SELECT 'nacional' AS origen, c.ocid, c.entidad_id, c.entidad_nombre,
                   c.fecha_convocatoria, c.metodo_base, c.monto_referencial_pen
            FROM casos_nacional c
            WHERE {VALID_SQL}
        ),
        marcados AS (
            SELECT *, list_contains(CAST($direct AS VARCHAR[]), metodo_base) AS directa,
                   CASE WHEN monto_referencial_pen >= 0 THEN monto_referencial_pen END AS monto
            FROM casos
        ),
        totales AS (
            SELECT origen, entidad_id,
                   coalesce(arg_max(entidad_nombre, fecha_convocatoria),
                            max(entidad_nombre)) AS entidad_nombre,
                   count(*) AS procesos,
                   count(*) FILTER (WHERE directa) AS directas,
                   sum(monto) AS monto,
                   coalesce(sum(monto) FILTER (WHERE directa), 0) AS monto_directas,
                   count(*) FILTER (WHERE monto IS NULL) AS sin_monto,
                   coalesce(list_sort(list(ocid) FILTER (WHERE directa)), []) AS ocids
            FROM marcados
            GROUP BY origen, entidad_id
        )
        SELECT *,
               {entity_type_sql("entidad_nombre")} AS tipo,
               directas / procesos AS part_procesos,
               CASE WHEN monto > 0 THEN monto_directas / monto END AS part_monto
        FROM totales
        """,
        {"direct": list(s05.direct_methods)},
    )
    con.execute(
        """
        CREATE OR REPLACE TEMP TABLE s05_grupos AS
        SELECT origen, tipo,
               count(*) AS n,
               quantile_cont(part_procesos, 0.25) AS q1_procesos,
               quantile_cont(part_procesos, 0.5) AS mediana_procesos,
               quantile_cont(part_procesos, 0.75) AS q3_procesos,
               quantile_cont(part_monto, 0.25) AS q1_monto,
               quantile_cont(part_monto, 0.5) AS mediana_monto,
               quantile_cont(part_monto, 0.75) AS q3_monto,
               list(part_procesos) AS valores_procesos,
               list(part_monto) FILTER (WHERE part_monto IS NOT NULL) AS valores_monto
        FROM s05_entidades
        WHERE procesos >= $minimum
        GROUP BY origen, tipo
        """,
        {"minimum": s05.minimum_processes},
    )
    con.execute(
        """
        CREATE OR REPLACE TEMP TABLE s05_candidatos AS
        WITH casos AS (
            SELECT e.*,
                   CASE WHEN gr.n >= $minimum_group THEN 'region' ELSE 'nacional' END AS ambito
            FROM s05_entidades e
            LEFT JOIN s05_grupos gr ON gr.origen = 'region' AND gr.tipo = e.tipo
            WHERE e.origen = 'region' AND e.procesos >= $minimum
        ),
        con_grupo AS (
            SELECT c.*, g.q1_procesos, g.mediana_procesos, g.q3_procesos, g.q1_monto,
                   g.mediana_monto, g.q3_monto, g.valores_procesos, g.valores_monto,
                   g.q3_procesos + $factor * (g.q3_procesos - g.q1_procesos) AS valla_procesos,
                   g.q3_monto + $factor * (g.q3_monto - g.q1_monto) AS valla_monto
            FROM casos c
            JOIN s05_grupos g ON g.origen = c.ambito AND g.tipo = c.tipo
        )
        SELECT *,
               coalesce(part_monto > valla_monto, false) AS por_monto,
               part_procesos > valla_procesos AS por_procesos
        FROM con_grupo
        WHERE directas >= $minimum_direct
          AND (coalesce(part_monto > valla_monto, false) OR part_procesos > valla_procesos)
        """,
        {
            "minimum_group": settings.minimum_group,
            "minimum": s05.minimum_processes,
            "minimum_direct": s05.minimum_direct,
            "factor": settings.tukey_factor,
        },
    )
    con.execute(
        f"""
        INSERT INTO senales BY NAME
        WITH k AS (
            SELECT *,
                   CASE WHEN por_monto THEN part_monto ELSE part_procesos END AS medida,
                   CASE WHEN por_monto THEN valla_monto ELSE valla_procesos END AS valla,
                   CASE WHEN por_monto THEN valores_monto ELSE valores_procesos END AS valores,
                   CASE WHEN por_monto THEN q1_monto ELSE q1_procesos END AS q1,
                   CASE WHEN por_monto THEN mediana_monto ELSE mediana_procesos END AS mediana,
                   CASE WHEN por_monto THEN q3_monto ELSE q3_procesos END AS q3
            FROM s05_candidatos
        )
        SELECT 'S05-' || entidad_id AS id,
               'S05' AS codigo,
               'competencia' AS categoria,
               'entidad' AS nivel,
               entidad_id,
               {{'tipo': 'entidad', 'id': entidad_id}} AS objeto,
               ocids,
               round(medida, 4) AS valor,
               CASE WHEN por_monto
                    THEN 'proporción del monto referencial por contratación directa'
                    ELSE 'proporción de procesos por contratación directa' END AS unidad,
               {{'operador': 'mayor_que', 'valor': round(valla, 4),
                 'descripcion': $threshold}} AS umbral,
               {{'descripcion': {GROUP_LABEL_SQL}
                                || CASE WHEN ambito = 'region' THEN ' de ' || $region
                                        ELSE ' de todo el país' END
                                || ' con ' || CAST($minimum AS VARCHAR) || ' procesos o más',
                 'ambito': ambito,
                 'n': len(valores),
                 'q1': round(q1, 4),
                 'mediana': round(mediana, 4),
                 'q3': round(q3, 4),
                 'valla_superior': round(valla, 4),
                 'percentil_del_caso': round(
                     100.0 * len(list_filter(valores, lambda x: x <= medida)) / len(valores), 2),
                 'proporcion_referencia': NULL::DOUBLE}} AS comparacion,
               {{'cardinal': NULL::VARCHAR, 'ocp': NULL::VARCHAR}} AS referencia,
               $version AS version_regla,
               to_json({{'tipo_entidad': tipo,
                         'procesos_totales': procesos,
                         'procesos_directos': directas,
                         'monto_pen': round(monto, 2),
                         'monto_directo_pen': round(monto_directas, 2),
                         'proporcion_procesos': round(part_procesos, 4),
                         'proporcion_monto': round(part_monto, 4),
                         'medida': CASE WHEN por_monto THEN 'monto' ELSE 'procesos' END,
                         'metodos_directos': CAST($direct AS VARCHAR[])}}) AS entradas,
               CASE WHEN sin_monto > 0
                    THEN ['hay procesos sin monto referencial en soles: no suman al monto']
                    ELSE CAST([] AS VARCHAR[]) END AS calidad,
               false AS simulado
        FROM k
        """,
        {
            "threshold": f"valla superior de Tukey (Q3 + {settings.tukey_factor:g} × RIC) "
            "de las entidades del mismo tipo",
            "region": context.region_label,
            "minimum": s05.minimum_processes,
            "version": s05.switch.rule_version,
            "direct": list(s05.direct_methods),
        },
    )
    (small,) = con.execute(
        "SELECT count(*) FROM s05_entidades WHERE origen = 'region' AND procesos < $minimum",
        {"minimum": s05.minimum_processes},
    ).fetchone()
    return [
        {"codigo": CODE, "motivo": "proceso en estado excluido", "cantidad": excluded},
        {"codigo": CODE, "motivo": "sin comprador", "cantidad": no_buyer},
        {"codigo": CODE, "motivo": "proceso sin método", "cantidad": no_method},
        {
            "codigo": CODE,
            "motivo": f"entidad con menos de {s05.minimum_processes} procesos",
            "cantidad": small,
        },
    ]
