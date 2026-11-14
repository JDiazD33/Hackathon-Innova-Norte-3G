"""Comparison groups shared by the signals (common method of the signal catalog).

A case is compared with the processes of the same base method and the same call year:
first in its region and with its kind of purchase (goods, services or works), then in its
region, and, if the regional group has fewer than ``minimo_grupo`` cases, in the whole
country. The result says which scope was used.
"""

from __future__ import annotations

import duckdb

OBJECT_LABEL_SQL = """CASE e.categoria WHEN 'goods' THEN 'bienes' WHEN 'services' THEN 'servicios'
                  WHEN 'works' THEN 'obras' ELSE 'objeto sin categoría' END"""


def prepare_cases(
    con: duckdb.DuckDBPyConnection,
    competitive: tuple[str, ...],
    non_competitive: tuple[str, ...],
    variants: dict[str, str],
    excluded_statuses: tuple[str, ...],
) -> None:
    """Create ``casos_region`` and ``casos_nacional``: processes with their base method.

    Expects the views ``procesos`` and ``procesos_nacionales``. Adds ``metodo_base`` (the method
    a variant is compared with), ``competitivo`` (NULL when the method is not classified) and
    ``excluido`` (the process status is one of the excluded statuses).
    """
    con.execute("CREATE OR REPLACE TEMP TABLE metodos_base (base VARCHAR, competitivo BOOLEAN)")
    methods = [(name, True) for name in competitive] + [(name, False) for name in non_competitive]
    con.executemany("INSERT INTO metodos_base VALUES (?, ?)", methods)
    con.execute("CREATE OR REPLACE TEMP TABLE variantes (nombre VARCHAR, base VARCHAR)")
    if variants:
        con.executemany("INSERT INTO variantes VALUES (?, ?)", list(variants.items()))
    for scope, source in (("region", "procesos"), ("nacional", "procesos_nacionales")):
        con.execute(
            f"""
            CREATE OR REPLACE TEMP TABLE casos_{scope} AS
            SELECT p.*,
                   coalesce(v.base, p.metodo) AS metodo_base,
                   m.competitivo,
                   coalesce(list_contains(CAST($excluded AS VARCHAR[]), p.estado), false)
                       AS excluido
            FROM {source} p
            LEFT JOIN variantes v ON v.nombre = p.metodo
            LEFT JOIN metodos_base m ON m.base = coalesce(v.base, p.metodo)
            """,
            {"excluded": list(excluded_statuses)},
        )


def build_comparison(
    con: duckdb.DuckDBPyConnection,
    name: str,
    measure_sql: str,
    population_sql: str,
    minimum_group: int,
    region_label: str,
    percentile: float | None = None,
    share_of_two_or_more: bool = False,
) -> None:
    """Create the temp table ``name``: one row per regional case with its comparison group.

    ``measure_sql`` is the value compared (for example ``numero_postores``) and
    ``population_sql`` the condition a process meets to be in a group, both evaluated over
    ``casos_region`` and ``casos_nacional``. Columns: ``ocid``, ``valor``,
    ``percentil_valor`` (the requested percentile of the group, 0 to 1) and ``comparacion``,
    with the fields of the data contract.
    """
    percentile_sql = f"quantile_cont(valor, {percentile!r})" if percentile is not None else "NULL"
    share_sql = "round(g.proporcion_dos_o_mas, 4)" if share_of_two_or_more else "NULL::DOUBLE"
    con.execute(
        f"""
        CREATE OR REPLACE TEMP TABLE {name}_valores AS
        SELECT 'region' AS origen, ocid, metodo_base, anio_convocatoria AS anio, categoria,
               CAST({measure_sql} AS DOUBLE) AS valor
        FROM casos_region WHERE {population_sql}
        UNION ALL
        SELECT 'nacional' AS origen, ocid, metodo_base, anio_convocatoria AS anio, categoria,
               CAST({measure_sql} AS DOUBLE) AS valor
        FROM casos_nacional WHERE {population_sql}
        """
    )
    con.execute(
        f"""
        CREATE OR REPLACE TEMP TABLE {name}_grupos AS
        WITH niveles AS (
            SELECT 'region_objeto' AS nivel, metodo_base, anio, categoria, valor
            FROM {name}_valores WHERE origen = 'region'
            UNION ALL
            SELECT 'region' AS nivel, metodo_base, anio, NULL AS categoria, valor
            FROM {name}_valores WHERE origen = 'region'
            UNION ALL
            SELECT 'nacional' AS nivel, metodo_base, anio, NULL AS categoria, valor
            FROM {name}_valores WHERE origen = 'nacional'
        )
        SELECT nivel, metodo_base, anio, categoria,
               count(*) AS n,
               quantile_cont(valor, 0.25) AS q1,
               quantile_cont(valor, 0.5) AS mediana,
               quantile_cont(valor, 0.75) AS q3,
               {percentile_sql} AS percentil_valor,
               avg(CASE WHEN valor >= 2 THEN 1.0 ELSE 0.0 END) AS proporcion_dos_o_mas,
               list(valor) AS valores
        FROM niveles
        GROUP BY ALL
        """
    )
    con.execute(
        f"""
        CREATE OR REPLACE TEMP TABLE {name} AS
        WITH casos AS (SELECT * FROM {name}_valores WHERE origen = 'region'),
        elegidos AS (
            SELECT c.ocid, c.valor, c.metodo_base, c.anio, c.categoria,
                   CASE WHEN go.n >= {minimum_group} THEN 'region_objeto'
                        WHEN gr.n >= {minimum_group} THEN 'region'
                        ELSE 'nacional' END AS nivel
            FROM casos c
            LEFT JOIN {name}_grupos go
              ON go.nivel = 'region_objeto'
             AND go.metodo_base IS NOT DISTINCT FROM c.metodo_base
             AND go.anio IS NOT DISTINCT FROM c.anio
             AND go.categoria IS NOT DISTINCT FROM c.categoria
            LEFT JOIN {name}_grupos gr
              ON gr.nivel = 'region'
             AND gr.metodo_base IS NOT DISTINCT FROM c.metodo_base
             AND gr.anio IS NOT DISTINCT FROM c.anio
        )
        SELECT e.ocid,
               e.valor,
               g.percentil_valor,
               {{
                   'descripcion': CASE e.nivel
                       WHEN 'region_objeto' THEN
                           CASE WHEN contains(lower(e.metodo_base), {OBJECT_LABEL_SQL})
                                THEN e.metodo_base
                                ELSE e.metodo_base || ' de ' || {OBJECT_LABEL_SQL} END
                           || ' en ' || $region || ', ' || e.anio
                       WHEN 'region' THEN e.metodo_base || ' en ' || $region || ', ' || e.anio
                       ELSE e.metodo_base || ' en todo el país, ' || e.anio
                   END,
                   'ambito': CASE WHEN e.nivel = 'nacional' THEN 'nacional' ELSE 'region' END,
                   'n': g.n,
                   'q1': round(g.q1, 4),
                   'mediana': round(g.mediana, 4),
                   'q3': round(g.q3, 4),
                   'valla_superior': NULL::DOUBLE,
                   'percentil_del_caso': round(
                       100.0 * len(list_filter(g.valores, lambda x: x <= e.valor)) / g.n, 2),
                   'proporcion_referencia': {share_sql}
               }} AS comparacion
        FROM elegidos e
        JOIN {name}_grupos g
          ON g.nivel = e.nivel
         AND g.metodo_base IS NOT DISTINCT FROM e.metodo_base
         AND g.anio IS NOT DISTINCT FROM e.anio
         AND (e.nivel <> 'region_objeto' OR g.categoria IS NOT DISTINCT FROM e.categoria)
        """,
        {"region": region_label},
    )
