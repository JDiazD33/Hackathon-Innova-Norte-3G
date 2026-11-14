"""Signals step: compute the active signals over the normalized tables.

Every rule writes rows with the same structure (the fields of ``senales/<entidad_id>.json`` in
the data contract, plus ``entidad_id``) to ``data/derived/senales/senales.parquet``. The
manifest next to it lists the active and deactivated signals, the counts and the exclusions.
"""

from __future__ import annotations

import json
from collections.abc import Callable
from pathlib import Path
from typing import Any

import duckdb

from pipeline.config import PipelineConfig, now_in_lima
from pipeline.normalize import StaleIngestError, manifest_path, tables_dir
from pipeline.ocds import connect, sql_string
from pipeline.signals import s01, s02
from pipeline.signals.groups import prepare_cases
from pipeline.signals.settings import SignalsConfig

SIGNALS_DIR = "senales"
RESULTS_FILE = "senales.parquet"
MANIFEST_FILE = "manifiesto.json"

Rule = Callable[[duckdb.DuckDBPyConnection, SignalsConfig, str], list[dict[str, Any]]]
RULES: dict[str, Rule] = {"S01": s01.compute, "S02": s02.compute}

RESULTS_TABLE_SQL = """
CREATE OR REPLACE TEMP TABLE senales (
    id VARCHAR,
    codigo VARCHAR,
    categoria VARCHAR,
    nivel VARCHAR,
    entidad_id VARCHAR,
    objeto STRUCT(tipo VARCHAR, id VARCHAR),
    ocids VARCHAR[],
    valor DOUBLE,
    unidad VARCHAR,
    umbral STRUCT(operador VARCHAR, valor DOUBLE, descripcion VARCHAR),
    comparacion STRUCT(descripcion VARCHAR, ambito VARCHAR, n BIGINT, q1 DOUBLE, mediana DOUBLE,
                       q3 DOUBLE, valla_superior DOUBLE, percentil_del_caso DOUBLE,
                       proporcion_referencia DOUBLE),
    referencia STRUCT(cardinal VARCHAR, ocp VARCHAR),
    version_regla VARCHAR,
    entradas JSON,
    calidad VARCHAR[],
    simulado BOOLEAN
)
"""


def signals_dir(data_dir: Path) -> Path:
    return data_dir / "derived" / SIGNALS_DIR


def results_path(data_dir: Path) -> Path:
    return signals_dir(data_dir) / RESULTS_FILE


def signals_manifest_path(data_dir: Path) -> Path:
    return signals_dir(data_dir) / MANIFEST_FILE


def _check_tables(config: PipelineConfig, data_dir: Path) -> Path:
    """The normalized tables, checked against the current scope."""
    tables = tables_dir(data_dir)
    needed = [tables / "procesos.parquet", tables / "procesos_nacionales.parquet"]
    if not all(path.exists() for path in needed) or not manifest_path(data_dir).exists():
        raise FileNotFoundError(
            f"Faltan las tablas normalizadas en {tables}. "
            "Ejecuta antes `uv run pipeline normalize`."
        )
    manifest = json.loads(manifest_path(data_dir).read_text(encoding="utf-8"))
    if (manifest["region"], manifest["anios"]) != (
        config.scope.department,
        list(config.scope.years),
    ):
        raise StaleIngestError(
            "Las tablas normalizadas son de otra región u otros años. "
            "Vuelve a ejecutar `uv run pipeline ingest` y `uv run pipeline normalize`."
        )
    return tables


def compute_signals(
    config: PipelineConfig, settings: SignalsConfig, data_dir: Path
) -> dict[str, Any]:
    """Compute the active signals and write their results and manifest."""
    tables = _check_tables(config, data_dir)
    output_dir = signals_dir(data_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    region_label = config.scope.department.title()

    con = connect()
    try:
        for view in ("procesos", "procesos_nacionales"):
            path = sql_string(str(tables / f"{view}.parquet"))
            con.execute(f"CREATE TEMP VIEW {view} AS SELECT * FROM read_parquet({path})")
        prepare_cases(
            con,
            settings.methods.competitive,
            settings.methods.non_competitive,
            settings.methods.variants,
            settings.excluded_statuses,
        )
        con.execute(RESULTS_TABLE_SQL)
        active: list[str] = []
        deactivated: list[dict[str, str | None]] = []
        exclusions: list[dict[str, Any]] = []
        for code, rule in RULES.items():
            switch = settings.switches[code]
            if switch.active:
                exclusions.extend(rule(con, settings, region_label))
                active.append(code)
            else:
                deactivated.append({"codigo": code, "motivo": switch.reason})
        output = sql_string(str(results_path(data_dir)))
        con.execute(
            f"COPY (SELECT * FROM senales ORDER BY codigo, id) TO {output} "
            "(FORMAT parquet, COMPRESSION zstd)"
        )
        counts = dict(
            con.execute("SELECT codigo, count(*) FROM senales GROUP BY codigo").fetchall()
        )
        unclassified = [
            row[0]
            for row in con.execute(
                "SELECT DISTINCT metodo FROM casos_region "
                "WHERE competitivo IS NULL AND metodo IS NOT NULL ORDER BY metodo"
            ).fetchall()
        ]
    finally:
        con.close()

    manifest = {
        "generado": now_in_lima(),
        "version_reglas": config.rules_version,
        "region": config.scope.department,
        "anios": list(config.scope.years),
        "senales_activas": active,
        "senales_desactivadas": deactivated,
        "versiones": {code: settings.switches[code].rule_version for code in active},
        "conteos": {code: counts.get(code, 0) for code in active},
        "exclusiones": exclusions,
        "metodos_sin_clasificar": unclassified,
        "parametros": {
            "factor_tukey": settings.tukey_factor,
            "minimo_grupo": settings.minimum_group,
            "estados_excluidos": list(settings.excluded_statuses),
            "S02": {
                "percentil": settings.s02.percentile,
                "plazo_inicio": settings.s02.start_column,
                "plazo_fin": settings.s02.end_column,
            },
        },
    }
    signals_manifest_path(data_dir).write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return manifest
