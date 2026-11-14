"""Ingest step (task 2.2): keep the processes of the configured department and years.

The department is the buyer's (``parties[id = buyer.id].address.department``) and the year is
the call's (``tender.datePublished``), as the data spike showed. Processes whose department
cannot be determined are excluded and counted. A process repeated across yearly files keeps
its most recent version.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pipeline.config import PipelineConfig, now_in_lima
from pipeline.ocds import MAX_OBJECT_SIZE, columns_literal, connect, sql_string

INTERIM_FILE = "releases.parquet"
SUMMARY_FILE = "ingesta.json"

REGION_UNKNOWN = "región indeterminada"
YEAR_UNKNOWN = "año de convocatoria indeterminado"
REPEATED_PROCESS = "proceso repetido entre archivos"

_BASE_SQL = """
CREATE OR REPLACE TEMP TABLE base AS
WITH leidos AS (
    SELECT *,
           string_split(replace(filename, '\\', '/'), '/')[-1] AS archivo,
           list_filter(parties, lambda p: p.id = buyer.id)[1] AS comprador
    FROM read_json($files, format = 'newline_delimited', columns = __COLUMNS__,
                   filename = true, maximum_object_size = __MAX_SIZE__)
),
marcados AS (
    SELECT *,
           comprador.address.department AS departamento,
           year(tender.datePublished) AS anio_convocatoria
    FROM leidos
),
alcance AS (
    SELECT *,
           coalesce(departamento = $department
                    AND list_contains($years, anio_convocatoria), false) AS en_alcance
    FROM marcados
)
SELECT ocid, date, archivo, departamento, anio_convocatoria, en_alcance,
       CASE WHEN en_alcance THEN {'id': id, 'buyer': buyer, 'comprador': comprador,
                                  'parties': parties, 'tender': tender, 'awards': awards,
                                  'contracts': contracts}
       END AS datos
FROM alcance
"""

_COUNTS_SQL = """
SELECT count(*) FILTER (WHERE departamento IS NULL
                          AND list_contains($years, anio_convocatoria)) AS region_indeterminada,
       count(*) FILTER (WHERE anio_convocatoria IS NULL
                          AND departamento = $department) AS anio_indeterminado,
       count(*) FILTER (WHERE en_alcance) AS en_alcance,
       count(DISTINCT ocid) FILTER (WHERE en_alcance) AS procesos
FROM base
"""

_OUTPUT_SQL = """
COPY (
    SELECT ocid, date, archivo, departamento,
           datos.comprador.address.region AS provincia,
           datos.comprador.address.locality AS distrito,
           anio_convocatoria,
           datos.*
    FROM base
    WHERE en_alcance
    QUALIFY row_number() OVER (PARTITION BY ocid ORDER BY date DESC NULLS LAST, archivo DESC) = 1
    ORDER BY ocid
) TO __PATH__ (FORMAT parquet, COMPRESSION zstd)
"""


def raw_paths(config: PipelineConfig, data_dir: Path) -> list[Path]:
    """The configured raw files, or an error that lists the missing ones."""
    paths = [data_dir / "raw" / name for name in config.download.files]
    missing = [str(path) for path in paths if not path.exists()]
    if missing:
        raise FileNotFoundError(
            f"Faltan archivos de datos: {', '.join(missing)}. Ejecuta `uv run pipeline download`."
        )
    return paths


def interim_path(data_dir: Path) -> Path:
    return data_dir / "interim" / INTERIM_FILE


def summary_path(data_dir: Path) -> Path:
    return data_dir / "interim" / SUMMARY_FILE


def ingest(config: PipelineConfig, data_dir: Path) -> dict[str, Any]:
    """Filter the raw files and write ``data/interim/releases.parquet`` and its summary."""
    sources = raw_paths(config, data_dir)
    output = interim_path(data_dir)
    output.parent.mkdir(parents=True, exist_ok=True)
    scope = {"department": config.scope.department, "years": list(config.scope.years)}

    con = connect()
    try:
        base_sql = _BASE_SQL.replace("__COLUMNS__", columns_literal()).replace(
            "__MAX_SIZE__", str(MAX_OBJECT_SIZE)
        )
        con.execute(base_sql, {"files": [str(path) for path in sources], **scope})
        read = dict(
            con.execute(
                "SELECT archivo, count(*) FROM base GROUP BY archivo ORDER BY archivo"
            ).fetchall()
        )
        region_unknown, year_unknown, in_scope, processes = con.execute(
            _COUNTS_SQL, scope
        ).fetchone()
        con.execute(_OUTPUT_SQL.replace("__PATH__", sql_string(str(output))))
    finally:
        con.close()

    summary = {
        "generado": now_in_lima(),
        "departamento": config.scope.department,
        "anios": list(config.scope.years),
        "archivos": [path.name for path in sources],
        "leidos": {path.name: read.get(path.name, 0) for path in sources},
        "procesos": processes,
        "exclusiones": [
            {"motivo": REGION_UNKNOWN, "cantidad": region_unknown},
            {"motivo": YEAR_UNKNOWN, "cantidad": year_unknown},
        ],
        "correcciones": [{"tipo": REPEATED_PROCESS, "cantidad": in_scope - processes}],
    }
    summary_path(data_dir).write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return summary
