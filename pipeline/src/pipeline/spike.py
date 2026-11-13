"""Data spike for Lote A (tasks 1.3 to 1.5 of the OpenSpec change).

Answers questions Q1-Q8 of ``docs/datos/fuente-de-datos.md`` with DuckDB queries over an OCDS
compiled-release file from the OCP Data Registry (``.jsonl`` or ``.jsonl.gz``, one contracting
process per line). Each query names the exact OCDS fields it reads, so the figures copied to the
documentation can be reproduced.
"""

from __future__ import annotations

import gzip
import json
from collections.abc import Iterable, Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, TextIO

import duckdb
import ocdscardinal

# Dates in the source carry the -05:00 offset; Lima keeps calendar days as published.
TIME_ZONE = "America/Lima"
# A compiled release can be several megabytes long.
MAX_OBJECT_SIZE = 256 * 1024 * 1024

# Paths of the Cardinal coverage report that matter for the signals (printed by `coverage`).
KEY_COVERAGE_PATHS = (
    "",
    "/buyer/id",
    "/parties[]/address/department",
    "/tender/datePublished",
    "/tender/tenderPeriod/startDate",
    "/tender/tenderPeriod/endDate",
    "/tender/enquiryPeriod/endDate",
    "/tender/numberOfTenderers",
    "/tender/tenderers[]/id",
    "/bids/details[]",
    "/tender/procurementMethod",
    "/tender/procurementMethodDetails",
    "/tender/items[]/classification/id",
    "/tender/items[]/additionalClassifications[]/id",
    "/awards[]/suppliers[]/id",
    "/awards[]/value/amount",
    "/contracts[]/status",
    "/contracts[]/value/amount",
    "/contracts[]/implementation/finalValue/amount",
)

# One row per contracting process, plus the buyer's own party (its address has the department).
PROCESOS_VIEW = """
CREATE OR REPLACE VIEW procesos AS
SELECT
    *,
    comprador.address.department AS departamento,
    year(tender.datePublished) AS anio_convocatoria
FROM (SELECT *, list_filter(parties, lambda p: p.id = buyer.id)[1] AS comprador FROM releases)
"""


@dataclass(frozen=True)
class Query:
    """A named spike query and the question it answers (Q1-Q7, or data quality)."""

    question: str
    name: str
    sql: str


QUERIES: tuple[Query, ...] = (
    Query(
        "general",
        "resumen",
        """
        SELECT count(*) AS procesos,
               count(DISTINCT ocid) AS ocid_distintos,
               min(date)::VARCHAR AS primera_actualizacion,
               max(date)::VARCHAR AS ultima_actualizacion,
               min(tender.datePublished)::VARCHAR AS primera_convocatoria,
               max(tender.datePublished)::VARCHAR AS ultima_convocatoria
        FROM procesos
        """,
    ),
    Query(
        "general",
        "procesos_por_anio_de_convocatoria",
        """
        SELECT anio_convocatoria, count(*) AS procesos
        FROM procesos
        GROUP BY ALL
        ORDER BY anio_convocatoria
        """,
    ),
    Query(
        "general",
        "campos_de_primer_nivel",
        "SELECT column_name AS campo FROM (DESCRIBE releases) ORDER BY campo",
    ),
    Query(
        "Q1",
        "cobertura_del_departamento",
        """
        SELECT count(*) AS procesos,
               count(buyer.id) AS con_buyer_id,
               count(comprador) AS con_party_del_comprador,
               count(departamento) AS con_department,
               count(comprador.address.region) AS con_region,
               count(*) FILTER (WHERE comprador.address.region IS DISTINCT FROM departamento)
                   AS region_distinta_de_department,
               count(*) FILTER (WHERE tender.procuringEntity.id = buyer.id)
                   AS procuringEntity_igual_a_buyer
        FROM procesos
        """,
    ),
    Query(
        "Q1",
        "procesos_por_departamento",
        """
        SELECT departamento, count(*) AS procesos
        FROM procesos
        GROUP BY ALL
        ORDER BY procesos DESC, departamento
        """,
    ),
    Query(
        "Q1",
        "provincias_del_departamento",
        """
        SELECT comprador.address.region AS provincia, count(*) AS procesos
        FROM procesos
        WHERE departamento = $department
        GROUP BY ALL
        ORDER BY procesos DESC, provincia
        """,
    ),
    Query(
        "Q2",
        "cobertura_de_tenderPeriod",
        """
        SELECT count(*) AS procesos,
               count(tender.tenderPeriod.startDate) AS con_startDate,
               count(tender.tenderPeriod.endDate) AS con_endDate,
               count(*) FILTER (WHERE tender.tenderPeriod.startDate = tender.tenderPeriod.endDate)
                   AS inicio_igual_a_fin,
               count(*) FILTER (
                   WHERE tender.tenderPeriod.startDate::DATE = tender.datePublished::DATE
               ) AS inicio_el_dia_de_la_convocatoria,
               count(tender.tenderPeriod.durationInDays) AS con_durationInDays,
               count(tender.enquiryPeriod.endDate) AS con_enquiryPeriod
        FROM procesos
        """,
    ),
    Query(
        "Q2",
        "plazos_por_metodo_en_los_anios",
        """
        SELECT tender.procurementMethodDetails AS metodo,
               count(*) AS procesos,
               count(*) FILTER (
                   WHERE tender.tenderPeriod.startDate < tender.tenderPeriod.endDate
               ) AS tenderPeriod_con_duracion,
               count(tender.enquiryPeriod.endDate) AS con_enquiryPeriod,
               quantile_cont(
                   round((epoch(tender.enquiryPeriod.endDate)
                          - epoch(tender.enquiryPeriod.startDate)) / 86400),
                   [0.1, 0.5, 0.9]
               ) AS dias_de_consultas_p10_p50_p90
        FROM procesos
        WHERE list_contains($years, anio_convocatoria)
        GROUP BY ALL
        ORDER BY procesos DESC, metodo
        """,
    ),
    Query(
        "Q2",
        "plazos_en_el_departamento",
        """
        SELECT count(*) AS procesos,
               count(*) FILTER (
                   WHERE tender.tenderPeriod.startDate < tender.tenderPeriod.endDate
               ) AS tenderPeriod_con_duracion,
               count(tender.enquiryPeriod.endDate) AS con_enquiryPeriod
        FROM procesos
        WHERE departamento = $department AND list_contains($years, anio_convocatoria)
        """,
    ),
    Query(
        "Q2",
        "dias_hasta_la_primera_acta_de_evaluacion",
        """
        WITH e AS (
            SELECT tender.procurementMethodDetails AS metodo,
                   tender.datePublished AS convocatoria,
                   list_min(list_transform(
                       list_filter(tender.documents,
                                   lambda d: d.documentType = 'evaluationReports'),
                       lambda d: d.datePublished)) AS primera_acta
            FROM procesos
            WHERE list_contains($years, anio_convocatoria)
        )
        SELECT metodo,
               count(*) AS procesos,
               count(primera_acta) AS con_acta,
               quantile_cont(date_diff('day', convocatoria::DATE, primera_acta::DATE),
                             [0.1, 0.5, 0.9]) AS dias_p10_p50_p90,
               count(*) FILTER (WHERE primera_acta < convocatoria)
                   AS acta_antes_de_la_convocatoria
        FROM e
        GROUP BY ALL
        ORDER BY procesos DESC, metodo
        """,
    ),
    Query(
        "Q3",
        "cobertura_de_postores",
        """
        SELECT count(*) AS procesos,
               count(tender.numberOfTenderers) AS con_numberOfTenderers,
               count(*) FILTER (WHERE len(tender.tenderers) > 0) AS con_tenderers,
               count(*) FILTER (WHERE tender.numberOfTenderers = len(tender.tenderers))
                   AS numero_igual_a_la_lista,
               count(*) FILTER (
                   WHERE len(tender.tenderers)
                         > len(list_distinct(list_transform(tender.tenderers, lambda t: t.id)))
               ) AS con_postor_duplicado,
               count(*) FILTER (WHERE tender.numberOfTenderers = 0) AS con_cero,
               count(*) FILTER (WHERE tender.numberOfTenderers = 1) AS con_uno
        FROM procesos
        """,
    ),
    Query(
        "Q3",
        "postores_en_procesos_desiertos",
        """
        WITH d AS (
            SELECT tender.numberOfTenderers AS n,
                   coalesce(list_bool_and(list_transform(
                       tender.items, lambda i: i.statusDetails = 'DESIERTO')), false) AS desierto
            FROM procesos
        )
        SELECT desierto AS todos_los_items_desiertos,
               count(*) AS procesos,
               count(n) AS con_numberOfTenderers,
               count(*) FILTER (WHERE n = 0) AS con_cero,
               quantile_cont(n, [0.25, 0.5, 0.75]) AS postores_q1_mediana_q3
        FROM d
        GROUP BY ALL
        ORDER BY ALL
        """,
    ),
    Query(
        "Q3",
        "postores_por_metodo_en_los_anios",
        """
        SELECT tender.procurementMethodDetails AS metodo,
               count(*) AS procesos_adjudicados,
               quantile_cont(tender.numberOfTenderers, [0.25, 0.5, 0.75])
                   AS postores_q1_mediana_q3,
               count(*) FILTER (WHERE tender.numberOfTenderers = 1) AS con_un_postor
        FROM procesos
        WHERE list_contains($years, anio_convocatoria) AND len(awards) > 0
        GROUP BY ALL
        ORDER BY procesos_adjudicados DESC, metodo
        """,
    ),
    Query(
        "Q3",
        "ganadores_en_la_lista_de_postores",
        """
        WITH a AS (SELECT tender.tenderers AS t, unnest(awards) AS a FROM procesos),
             s AS (SELECT t, unnest(a.suppliers) AS s FROM a)
        SELECT count(*) AS proveedores_adjudicados,
               count(*) FILTER (
                   WHERE list_contains(list_transform(t, lambda x: x.id), s.id)
               ) AS presentes_en_tenderers
        FROM s
        """,
    ),
    Query(
        "Q3",
        "casos_para_verificar_en_el_seace",
        """
        WITH r AS (
            SELECT ocid, tender.title AS nomenclatura, buyer.name AS entidad,
                   tender.procurementMethodDetails AS metodo,
                   tender.numberOfTenderers AS postores,
                   tender.procurementMethod AS procurementMethod,
                   len(awards) > 0 AS adjudicado,
                   coalesce(list_bool_and(list_transform(
                       tender.items, lambda i: i.statusDetails = 'DESIERTO')), false) AS desierto
            FROM procesos
            WHERE departamento = $department AND list_contains($years, anio_convocatoria)
        )
        (SELECT 'adjudicado con un solo postor' AS caso, ocid, nomenclatura, entidad, metodo,
                postores
         FROM r
         WHERE postores = 1 AND adjudicado AND procurementMethod IS DISTINCT FROM 'direct'
         ORDER BY ocid
         LIMIT 5)
        UNION ALL
        (SELECT 'desierto con varios postores' AS caso, ocid, nomenclatura, entidad, metodo,
                postores
         FROM r
         WHERE desierto AND postores > 1
         ORDER BY postores DESC, ocid
         LIMIT 5)
        """,
    ),
    Query(
        "Q4",
        "esquemas_de_clasificacion",
        """
        WITH i AS (SELECT ocid, unnest(tender.items) AS i FROM procesos),
             c AS (
                 SELECT ocid, 'classification' AS campo,
                        i.classification.scheme AS esquema, i.classification.id AS codigo
                 FROM i
             ),
             a AS (
                 SELECT ocid, 'additionalClassifications' AS campo, x.scheme AS esquema,
                        x.id AS codigo
                 FROM (SELECT ocid, unnest(i.additionalClassifications) AS x FROM i)
             )
        SELECT campo, esquema, count(*) AS items, count(DISTINCT ocid) AS procesos,
               min(length(codigo)) AS digitos_min, max(length(codigo)) AS digitos_max
        FROM (SELECT * FROM c UNION ALL SELECT * FROM a)
        GROUP BY ALL
        ORDER BY campo DESC, items DESC
        """,
    ),
    Query(
        "Q4",
        "cubso_empieza_con_unspsc",
        """
        WITH i AS (SELECT unnest(tender.items) AS i FROM procesos),
             a AS (
                 SELECT i.classification.id AS cubso, unnest(i.additionalClassifications) AS u
                 FROM i
             )
        SELECT count(*) AS items_con_ambos,
               count(*) FILTER (WHERE left(cubso, 8) = u.id) AS cubso_empieza_con_unspsc
        FROM a
        WHERE u.scheme = 'UNSPSC'
        """,
    ),
    Query(
        "Q4",
        "niveles_de_clasificacion_en_el_departamento",
        """
        WITH i AS (
            SELECT ocid, unnest(tender.items) AS i
            FROM procesos
            WHERE departamento = $department AND list_contains($years, anio_convocatoria)
        )
        SELECT count(DISTINCT ocid) AS procesos,
               count(DISTINCT ocid) FILTER (WHERE i.classification.id IS NOT NULL)
                   AS procesos_clasificados,
               count(DISTINCT left(i.classification.id, 2)) AS segmentos,
               count(DISTINCT left(i.classification.id, 4)) AS familias,
               count(DISTINCT left(i.classification.id, 6)) AS clases,
               count(DISTINCT left(i.classification.id, 8)) AS productos_unspsc,
               count(DISTINCT i.classification.id) AS codigos_cubso
        FROM i
        """,
    ),
    Query(
        "Q5",
        "metodos",
        """
        SELECT tender.procurementMethodDetails AS metodo,
               tender.procurementMethod AS procurementMethod,
               count(*) AS procesos
        FROM procesos
        GROUP BY ALL
        ORDER BY procesos DESC, metodo
        """,
    ),
    Query(
        "Q5",
        "metodos_en_el_departamento",
        """
        SELECT tender.procurementMethodDetails AS metodo,
               tender.procurementMethod AS procurementMethod,
               count(*) AS procesos,
               count(*) FILTER (WHERE tender.numberOfTenderers = 1) AS con_un_postor
        FROM procesos
        WHERE departamento = $department AND list_contains($years, anio_convocatoria)
        GROUP BY ALL
        ORDER BY procesos DESC, metodo
        """,
    ),
    Query(
        "Q5",
        "categorias_en_el_departamento",
        """
        SELECT tender.mainProcurementCategory AS categoria, count(*) AS procesos
        FROM procesos
        WHERE departamento = $department AND list_contains($years, anio_convocatoria)
        GROUP BY ALL
        ORDER BY procesos DESC, categoria
        """,
    ),
    Query(
        "Q6",
        "culminacion_por_anio_de_convocatoria",
        """
        WITH c AS (SELECT anio_convocatoria, unnest(contracts) AS c FROM procesos)
        SELECT anio_convocatoria,
               count(*) AS contratos,
               count(c.implementation.finalValue.amount) AS con_monto_final,
               round(100.0 * count(c.implementation.finalValue.amount) / count(*), 1)
                   AS pct_con_monto_final,
               count(c.implementation.endDate) AS con_fecha_de_termino
        FROM c
        GROUP BY ALL
        ORDER BY anio_convocatoria
        """,
    ),
    Query(
        "Q6",
        "culminacion_en_el_departamento",
        """
        WITH c AS (
            SELECT unnest(contracts) AS c
            FROM procesos
            WHERE departamento = $department AND list_contains($years, anio_convocatoria)
        )
        SELECT count(*) AS contratos,
               count(c.implementation.finalValue.amount) AS con_monto_final,
               round(100.0 * count(c.implementation.finalValue.amount) / count(*), 1)
                   AS pct_con_monto_final
        FROM c
        """,
    ),
    Query(
        "Q6",
        "monto_final_frente_al_contratado",
        """
        WITH c AS (SELECT unnest(contracts) AS c FROM procesos)
        SELECT c.value.currency AS moneda_del_contrato,
               c.implementation.finalValue.currency AS moneda_del_monto_final,
               count(*) AS contratos,
               count(*) FILTER (WHERE c.implementation.finalValue.amount > c.value.amount)
                   AS monto_final_mayor,
               quantile_cont(c.implementation.finalValue.amount / c.value.amount,
                             [0.1, 0.25, 0.5, 0.75, 0.9]) AS razon_final_entre_contratado
        FROM c
        WHERE c.implementation.finalValue.amount IS NOT NULL AND c.value.amount > 0
        GROUP BY ALL
        ORDER BY contratos DESC
        """,
    ),
    Query(
        "Q7",
        "departamento_por_anio_de_convocatoria",
        """
        SELECT anio_convocatoria,
               count(*) AS procesos,
               count(DISTINCT buyer.id) AS entidades,
               count(*) FILTER (WHERE len(awards) > 0) AS con_adjudicacion,
               count(*) FILTER (WHERE len(contracts) > 0) AS con_contrato,
               round(sum(tender.value.amount_PEN) / 1e6, 1) AS valor_referencial_millones_pen
        FROM procesos
        WHERE departamento = $department
        GROUP BY ALL
        ORDER BY anio_convocatoria
        """,
    ),
    Query(
        "Q7",
        "montos_en_el_departamento",
        """
        SELECT count(*) AS procesos,
               count(*) FILTER (WHERE tender.value.amount > 0) AS con_valor_referencial,
               count(*) FILTER (WHERE tender.value.currency <> 'PEN') AS en_otra_moneda,
               count(tender.value.amount_PEN) AS con_amount_PEN
        FROM procesos
        WHERE departamento = $department AND list_contains($years, anio_convocatoria)
        """,
    ),
    Query(
        "calidad",
        "fechas_de_adjudicacion",
        """
        WITH a AS (
            SELECT unnest(awards) AS a
            FROM procesos
            WHERE list_contains($years, anio_convocatoria)
        )
        SELECT count(*) AS adjudicaciones, count(a.date) AS con_fecha
        FROM a
        """,
    ),
    Query(
        "calidad",
        "contratos",
        """
        WITH c AS (SELECT awards, unnest(contracts) AS c FROM procesos)
        SELECT count(*) AS contratos,
               count(*) FILTER (WHERE c.status IS NULL) AS sin_estado,
               count(*) FILTER (
                   WHERE NOT list_contains(
                       list_transform(coalesce(awards, []), lambda a: a.id), c.awardID)
               ) AS sin_adjudicacion_vinculada
        FROM c
        """,
    ),
    Query(
        "calidad",
        "estados_de_contratos",
        """
        WITH c AS (SELECT unnest(contracts) AS c FROM procesos)
        SELECT c.status AS status, c.statusDetails AS statusDetails, count(*) AS contratos
        FROM c
        GROUP BY ALL
        ORDER BY contratos DESC
        """,
    ),
    Query(
        "calidad",
        "adjudicaciones",
        """
        WITH a AS (SELECT contracts, unnest(awards) AS a FROM procesos)
        SELECT count(*) AS adjudicaciones,
               count(*) FILTER (
                   WHERE NOT list_contains(
                       list_transform(coalesce(contracts, []), lambda c: c.awardID), a.id)
               ) AS sin_contrato_vinculado,
               count(*) FILTER (WHERE coalesce(len(a.suppliers), 0) = 0) AS sin_proveedor,
               count(*) FILTER (WHERE len(a.suppliers) > 1) AS con_varios_proveedores
        FROM a
        """,
    ),
    Query(
        "calidad",
        "estados_de_items",
        """
        WITH i AS (SELECT unnest(tender.items) AS i FROM procesos)
        SELECT i.status AS status, i.statusDetails AS statusDetails, count(*) AS items
        FROM i
        GROUP BY ALL
        ORDER BY items DESC
        """,
    ),
    Query(
        "calidad",
        "identificadores_de_proveedores",
        """
        WITH s AS (
            SELECT unnest(a.suppliers) AS s
            FROM (SELECT unnest(awards) AS a FROM procesos)
        )
        SELECT CASE
                   WHEN regexp_full_match(s.id, 'PE-RUC-10[0-9]{9}') THEN 'RUC 10'
                   WHEN regexp_full_match(s.id, 'PE-RUC-1[5-7][0-9]{9}') THEN 'RUC 15, 16 o 17'
                   WHEN regexp_full_match(s.id, 'PE-RUC-20[0-9]{9}') THEN 'RUC 20'
                   WHEN regexp_full_match(s.id, 'PE-RUC-[0-9]{1,8}') THEN 'codigo corto (no es RUC)'
                   ELSE 'otro'
               END AS tipo_de_identificador,
               count(*) AS adjudicaciones,
               count(DISTINCT s.id) AS proveedores
        FROM s
        GROUP BY ALL
        ORDER BY adjudicaciones DESC
        """,
    ),
    Query(
        "calidad",
        "monedas",
        """
        SELECT tender.value.currency AS moneda, count(*) AS procesos
        FROM procesos
        GROUP BY ALL
        ORDER BY procesos DESC
        """,
    ),
    Query(
        "calidad",
        "tipos_de_documento",
        """
        WITH d AS (SELECT unnest(tender.documents) AS d FROM procesos)
        SELECT d.documentType AS documentType, count(*) AS documentos
        FROM d
        GROUP BY ALL
        ORDER BY documentos DESC
        """,
    ),
)


def connect(database: Path | str = ":memory:") -> duckdb.DuckDBPyConnection:
    """Open DuckDB with the time zone used to read OCDS dates."""
    con = duckdb.connect(str(database))
    con.execute(f"SET TimeZone = '{TIME_ZONE}'")
    return con


def load_releases(con: duckdb.DuckDBPyConnection, source: Path) -> int:
    """Load every compiled release of ``source`` into the ``releases`` table.

    The schema is inferred from the whole file, so fields present in only a few releases are kept.
    Returns the number of loaded releases.
    """
    con.execute(
        """
        CREATE OR REPLACE TABLE releases AS
        SELECT * FROM read_json(
            $source, format = 'newline_delimited', sample_size = -1,
            maximum_object_size = $max_size)
        """,
        {"source": str(source), "max_size": MAX_OBJECT_SIZE},
    )
    con.execute(PROCESOS_VIEW)
    row = con.execute("SELECT count(*) FROM releases").fetchone()
    return int(row[0]) if row else 0


def run_query(
    con: duckdb.DuckDBPyConnection, query: Query, department: str, years: Iterable[int]
) -> dict[str, Any]:
    """Run one spike query and return its columns and rows."""
    params: dict[str, Any] = {}
    if "$department" in query.sql:
        params["department"] = department
    if "$years" in query.sql:
        params["years"] = list(years)
    relation = con.execute(query.sql, params)
    columns = [description[0] for description in relation.description]
    return {
        "pregunta": query.question,
        "nombre": query.name,
        "columnas": columns,
        "filas": [list(row) for row in relation.fetchall()],
        "sql": " ".join(query.sql.split()),
    }


def run_queries(
    con: duckdb.DuckDBPyConnection, department: str, years: Iterable[int]
) -> list[dict[str, Any]]:
    """Run every spike query against an already loaded connection."""
    years = list(years)
    return [run_query(con, query, department, years) for query in QUERIES]


def build_report(
    source: Path, results: list[dict[str, Any]], department: str, years: Iterable[int]
) -> dict[str, Any]:
    """Wrap the query results with the metadata needed to reproduce them."""
    return {
        "fuente": source.name,
        "generado": datetime.now(UTC).isoformat(timespec="seconds"),
        "departamento": department,
        "anios": list(years),
        "consultas": results,
    }


def write_json(data: Any, destination: Path) -> None:
    """Write ``data`` as UTF-8 JSON, creating the parent folder if needed."""
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(
        json.dumps(data, ensure_ascii=False, indent=2, default=str) + "\n", encoding="utf-8"
    )


def format_result(result: dict[str, Any], max_rows: int = 20) -> str:
    """Render one query result as plain text for the terminal."""
    lines = [f"[{result['pregunta']}] {result['nombre']}", " | ".join(result["columnas"])]
    rows = result["filas"]
    lines.extend(" | ".join(str(value) for value in row) for row in rows[:max_rows])
    if len(rows) > max_rows:
        lines.append(f"... ({len(rows) - max_rows} filas más en el informe JSON)")
    return "\n".join(lines)


@contextmanager
def open_text(path: Path) -> Iterator[TextIO]:
    """Open a ``.jsonl`` or ``.jsonl.gz`` file as UTF-8 text."""
    if path.suffix == ".gz":
        with gzip.open(path, "rt", encoding="utf-8", newline="") as handle:
            yield handle
    else:
        with path.open(encoding="utf-8", newline="") as handle:
            yield handle


def buyer_department(release: dict[str, Any]) -> str | None:
    """Department of the buyer, taken from the buyer's own entry in ``parties``."""
    buyer_id = (release.get("buyer") or {}).get("id")
    for party in release.get("parties") or []:
        if buyer_id is not None and party.get("id") == buyer_id:
            return (party.get("address") or {}).get("department")
    return None


def publication_year(release: dict[str, Any]) -> int | None:
    """Year of ``tender.datePublished`` as published (local Peruvian time)."""
    published = (release.get("tender") or {}).get("datePublished")
    if isinstance(published, str) and len(published) >= 4 and published[:4].isdigit():
        return int(published[:4])
    return None


def write_sample(source: Path, destination: Path, department: str, years: Iterable[int]) -> int:
    """Copy, unchanged, the lines of the processes of ``department`` published in ``years``.

    Returns the number of copied processes.
    """
    wanted = set(years)
    copied = 0
    destination.parent.mkdir(parents=True, exist_ok=True)
    with (
        open_text(source) as lines,
        destination.open("w", encoding="utf-8", newline="\n") as output,
    ):
        for line in lines:
            if not line.strip():
                continue
            release = json.loads(line)
            if buyer_department(release) == department and publication_year(release) in wanted:
                output.write(line.rstrip("\r\n") + "\n")
                copied += 1
    return copied


def cardinal_coverage(source: Path) -> dict[str, int]:
    """Run ``ocdscardinal.coverage``: how many times each field path is non-empty."""
    return dict(sorted(ocdscardinal.coverage(str(source)).items()))
