"""Normalize step (tasks 2.3 to 2.5): normalized Parquet tables and the run manifest.

Each table keeps ``ocid`` and the original OCDS identifiers, untranslated. The quality issues of
the source are treated without dropping the process, and every correction is counted.
The columns and the OCDS field each one comes from are listed in
``docs/datos/tablas-normalizadas.md``.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pipeline import __version__
from pipeline.config import PipelineConfig, now_in_lima
from pipeline.download import metadata_path
from pipeline.ingest import interim_path, national_path, summary_path
from pipeline.ocds import ITEM_STATUS_SQL, connect, sql_string

TABLES_DIR = "tablas"
MANIFEST_FILE = "manifiesto.json"

TABLES: dict[str, str] = {
    "procesos": """
        SELECT ocid,
               buyer.id AS entidad_id,
               tender.title AS nomenclatura,
               tender.description AS descripcion,
               tender.procurementMethodDetails AS metodo,
               tender.procurementMethod AS metodo_ocds,
               tender.mainProcurementCategory AS categoria,
               tender.value.currency AS moneda,
               tender.value.amount AS monto_referencial,
               tender.value.amount_PEN AS monto_referencial_pen,
               CAST(tender.datePublished AS DATE) AS fecha_convocatoria,
               anio_convocatoria,
               CAST(tender.tenderPeriod.startDate AS DATE) AS fecha_inicio_presentacion,
               CAST(tender.tenderPeriod.endDate AS DATE) AS fecha_fin_presentacion,
               CAST(tender.enquiryPeriod.startDate AS DATE) AS fecha_inicio_consultas,
               CAST(tender.enquiryPeriod.endDate AS DATE) AS fecha_fin_consultas,
               tender.numberOfTenderers AS numero_postores,
               __STATUS__ AS estado,
               departamento,
               provincia,
               distrito,
               archivo,
               CAST(date AS DATE) AS fecha_actualizacion
        FROM r
        ORDER BY ocid
    """,
    "entidades": """
        SELECT buyer.id AS entidad_id,
               arg_max(coalesce(buyer.name, comprador.name), date) AS nombre,
               arg_max((list_filter(comprador.additionalIdentifiers,
                                    lambda x: x.scheme = 'PE-RUC')[1]).id, date) AS ruc,
               arg_max(departamento, date) AS departamento,
               arg_max(provincia, date) AS provincia,
               arg_max(distrito, date) AS distrito,
               count(*) AS procesos
        FROM r
        GROUP BY buyer.id
        ORDER BY entidad_id
    """,
    "postores": """
        SELECT DISTINCT ocid, t.id AS proveedor_id
        FROM (SELECT ocid, unnest(tender.tenderers) AS t FROM r)
        WHERE t.id IS NOT NULL
        ORDER BY ocid, proveedor_id
    """,
    "adjudicaciones": """
        SELECT * FROM (
            SELECT ocid,
                   a.id AS adjudicacion_id,
                   unnest(proveedores) AS proveedor_id,
                   CAST(a.date AS DATE) AS fecha_adjudicacion,
                   a.value.amount AS monto,
                   a.value.currency AS moneda,
                   coalesce(list_contains(list_transform(coalesce(contracts, []),
                                                         lambda c: c.awardID), a.id),
                            false) AS tiene_contrato
            FROM (
                SELECT ocid, contracts, a,
                       CASE WHEN coalesce(len(a.suppliers), 0) = 0 THEN [NULL::VARCHAR]
                            ELSE list_transform(a.suppliers, lambda s: s.id)
                       END AS proveedores
                FROM (SELECT ocid, contracts, unnest(awards) AS a FROM r)
            )
        )
        ORDER BY ocid, adjudicacion_id, proveedor_id
    """,
    "contratos": """
        SELECT ocid,
               c.id AS contrato_id,
               c.awardID AS adjudicacion_id,
               coalesce(list_contains(list_transform(coalesce(awards, []), lambda a: a.id),
                                      c.awardID), false) AS adjudicacion_vinculada,
               coalesce(c.status, 'sin estado') AS estado,
               c.statusDetails AS estado_detalle,
               CAST(c.dateSigned AS DATE) AS fecha_firma,
               c.value.amount AS monto,
               c.value.currency AS moneda,
               c.implementation.finalValue.amount AS monto_final,
               c.implementation.finalValue.currency AS moneda_monto_final,
               CAST(c.implementation.endDate AS DATE) AS fecha_culminacion
        FROM (SELECT ocid, awards, unnest(contracts) AS c FROM r)
        ORDER BY ocid, contrato_id
    """,
    "proveedores": """
        WITH candidatos AS (
            SELECT t.id AS proveedor_id, t.name AS nombre, date
            FROM (SELECT date, unnest(tender.tenderers) AS t FROM r)
            UNION ALL
            SELECT s.id, s.name, date
            FROM (SELECT date, unnest(a.suppliers) AS s
                  FROM (SELECT date, unnest(awards) AS a FROM r))
        ),
        agrupados AS (
            SELECT proveedor_id,
                   arg_max(nombre, date) FILTER (WHERE nombre IS NOT NULL) AS nombre,
                   CASE WHEN regexp_full_match(proveedor_id, 'PE-RUC-[0-9]{11}')
                        THEN substr(proveedor_id, 8) END AS ruc
            FROM candidatos
            WHERE proveedor_id IS NOT NULL
            GROUP BY proveedor_id
        )
        SELECT proveedor_id,
               ruc,
               nombre,
               CASE WHEN ruc IS NULL THEN 'desconocido'
                    WHEN list_contains($natural_prefixes, left(ruc, 2)) THEN 'persona_natural'
                    WHEN list_contains($legal_prefixes, left(ruc, 2)) THEN 'persona_juridica'
                    ELSE 'desconocido'
               END AS tipo
        FROM agrupados
        ORDER BY proveedor_id
    """,
    "items": """
        SELECT ocid,
               i.id AS item_id,
               i.description AS descripcion,
               i.quantity AS cantidad,
               i.unit.name AS unidad,
               i.status AS estado,
               i.statusDetails AS estado_detalle,
               CASE WHEN i.classification.scheme = 'CUBSO' THEN i.classification.id END AS cubso,
               coalesce((list_filter(i.additionalClassifications,
                                     lambda x: x.scheme = 'UNSPSC')[1]).id,
                        CASE WHEN i.classification.scheme = 'UNSPSC'
                             THEN i.classification.id END) AS unspsc,
               i.totalValue.amount AS monto,
               i.totalValue.currency AS moneda
        FROM (SELECT ocid, unnest(tender.items) AS i FROM r)
        ORDER BY ocid, item_id
    """,
    "documentos": """
        WITH licitacion AS (
            SELECT ocid, 'tender' AS seccion, NULL::VARCHAR AS contrato_id,
                   unnest(tender.documents) AS d
            FROM r
        ),
        contrato AS (
            SELECT ocid, 'contracts' AS seccion, c.id AS contrato_id, unnest(c.documents) AS d
            FROM (SELECT ocid, unnest(contracts) AS c FROM r)
        )
        SELECT ocid, seccion, contrato_id,
               d.id AS documento_id,
               coalesce(d.documentType, 'sin tipo') AS tipo,
               d.title AS titulo,
               d.url AS url,
               CAST(d.datePublished AS DATE) AS fecha_publicacion,
               d.format AS formato
        FROM (SELECT * FROM licitacion UNION ALL SELECT * FROM contrato)
        ORDER BY ocid, seccion DESC, contrato_id, documento_id
    """,
    "procesos_nacionales": """
        SELECT ocid, entidad_id, entidad_nombre, departamento, anio_convocatoria, metodo,
               categoria, numero_postores, estado, fecha_convocatoria, fecha_inicio_presentacion,
               fecha_fin_presentacion, fecha_inicio_consultas, fecha_fin_consultas,
               monto_referencial_pen, archivo
        FROM n
        ORDER BY ocid
    """,
}

# Quality corrections, measured on the source (``r``) so they do not depend on the tables.
CORRECTIONS: dict[str, str] = {
    "postor duplicado": """
        SELECT count(*) - count(DISTINCT ocid || '|' || t.id)
        FROM (SELECT ocid, unnest(tender.tenderers) AS t FROM r)
        WHERE t.id IS NOT NULL
    """,
    "contrato sin estado": """
        SELECT count(*) FROM (SELECT unnest(contracts) AS c FROM r) WHERE c.status IS NULL
    """,
    "adjudicación sin contrato": """
        SELECT count(*)
        FROM (SELECT contracts, unnest(awards) AS a FROM r)
        WHERE NOT coalesce(list_contains(list_transform(coalesce(contracts, []),
                                                        lambda c: c.awardID), a.id), false)
    """,
    "contrato sin adjudicación vinculada": """
        SELECT count(*)
        FROM (SELECT awards, unnest(contracts) AS c FROM r)
        WHERE NOT coalesce(list_contains(list_transform(coalesce(awards, []),
                                                        lambda a: a.id), c.awardID), false)
    """,
    "adjudicación sin proveedor": """
        SELECT count(*) FROM (SELECT unnest(awards) AS a FROM r)
        WHERE coalesce(len(a.suppliers), 0) = 0
    """,
    "documento sin tipo": """
        SELECT (SELECT count(*) FROM (SELECT unnest(tender.documents) AS d FROM r)
                WHERE d.documentType IS NULL)
             + (SELECT count(*)
                FROM (SELECT unnest(c.documents) AS d
                      FROM (SELECT unnest(contracts) AS c FROM r))
                WHERE d.documentType IS NULL)
    """,
}


class StaleIngestError(RuntimeError):
    """The interim data was ingested with a different scope than the current configuration."""


def tables_dir(data_dir: Path) -> Path:
    return data_dir / "derived" / TABLES_DIR


def manifest_path(data_dir: Path) -> Path:
    return tables_dir(data_dir) / MANIFEST_FILE


def read_summary(config: PipelineConfig, data_dir: Path) -> dict[str, Any]:
    """The ingest summary, checked against the current scope."""
    path = summary_path(data_dir)
    interim_files = (interim_path(data_dir), national_path(data_dir))
    if not path.exists() or not all(file.exists() for file in interim_files):
        raise FileNotFoundError(f"Falta {path}. Ejecuta antes `uv run pipeline ingest`.")
    summary = json.loads(path.read_text(encoding="utf-8"))
    current = (config.scope.department, list(config.scope.years), list(config.download.files))
    ingested = (summary["departamento"], summary["anios"], summary["archivos"])
    if current != ingested:
        raise StaleIngestError(
            "La ingesta se hizo con otra región, otros años u otros archivos. "
            "Vuelve a ejecutar `uv run pipeline ingest`."
        )
    return summary


def source_files(config: PipelineConfig, data_dir: Path) -> list[dict[str, Any]]:
    """The download record of each configured file (empty values if it was not recorded)."""
    files = []
    for name in config.download.files:
        record_path = metadata_path(data_dir / "raw" / name)
        record = json.loads(record_path.read_text(encoding="utf-8")) if record_path.exists() else {}
        files.append(
            {
                "nombre": name,
                "url": record.get("url"),
                "descargado": record.get("descargado"),
                "bytes": record.get("bytes"),
                "sha256": record.get("sha256"),
                "ultima_modificacion": record.get("ultima_modificacion"),
            }
        )
    return files


def normalize(config: PipelineConfig, data_dir: Path) -> dict[str, Any]:
    """Write the normalized tables to ``data/derived/tablas/`` and the run manifest."""
    summary = read_summary(config, data_dir)
    output_dir = tables_dir(data_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    params = {
        "natural_prefixes": list(config.suppliers.natural_person_prefixes),
        "legal_prefixes": list(config.suppliers.legal_person_prefixes),
    }

    con = connect()
    try:
        con.execute(
            "CREATE TEMP VIEW r AS SELECT * FROM read_parquet("
            + sql_string(str(interim_path(data_dir)))
            + ")"
        )
        con.execute(
            "CREATE TEMP VIEW n AS SELECT * FROM read_parquet("
            + sql_string(str(national_path(data_dir)))
            + ")"
        )
        counts: dict[str, int] = {}
        for name, sql in TABLES.items():
            used = {key: value for key, value in params.items() if f"${key}" in sql}
            sql = sql.replace("__STATUS__", ITEM_STATUS_SQL)
            con.execute(f"CREATE OR REPLACE TEMP TABLE {name} AS {sql}", used)
            path = output_dir / f"{name}.parquet"
            con.execute(
                f"COPY {name} TO {sql_string(str(path))} (FORMAT parquet, COMPRESSION zstd)"
            )
            counts[name] = con.execute(
                f"SELECT count(*) FROM read_parquet({sql_string(str(path))})"
            ).fetchone()[0]
        corrections = [
            {"tipo": kind, "cantidad": con.execute(sql).fetchone()[0]}
            for kind, sql in CORRECTIONS.items()
        ]
    finally:
        con.close()

    files = source_files(config, data_dir)
    cut_dates = [file["ultima_modificacion"][:10] for file in files if file["ultima_modificacion"]]
    manifest = {
        "version_pipeline": __version__,
        "version_reglas": config.rules_version,
        "generado": now_in_lima(),
        "fuente": {
            "nombre": config.source.name,
            "url": config.source.url,
            "licencia": config.source.license,
            "atribucion": config.source.attribution,
            "archivos": files,
        },
        "fecha_corte": max(cut_dates) if cut_dates else None,
        "region": config.scope.department,
        "anios": list(config.scope.years),
        "leidos": summary["leidos"],
        "conteos": counts,
        "exclusiones": summary["exclusiones"],
        "correcciones": summary["correcciones"] + corrections,
    }
    manifest_path(data_dir).write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return manifest
