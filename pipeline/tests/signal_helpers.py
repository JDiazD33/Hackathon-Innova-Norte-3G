"""Shared helpers for the signal tests: synthetic raw files, pipeline runs and result readers."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import duckdb
from factories import release, write_config, write_download_record, write_jsonl_gz

from pipeline.config import PipelineConfig, load_config
from pipeline.ingest import ingest
from pipeline.normalize import normalize
from pipeline.signals.compute import compute_signals, results_path
from pipeline.signals.settings import DEFAULT_SIGNALS_CONFIG, load_signals_config

SIGNALS_TOML = DEFAULT_SIGNALS_CONFIG.read_text(encoding="utf-8")
S02_ACTIVE = SIGNALS_TOML.replace("[S02]\nactiva = false", "[S02]\nactiva = true")
DATE_2025 = {"published": "2025-04-01T10:00:00-05:00", "updated": "2025-05-01T10:00:00-05:00"}
OTHER_REGION = {"department": "PIURA", "entity": "PE-CONSUCODE-7"}
CUT_DATE = "2026-10-04"


def tenderers(count: int) -> list[str]:
    return [f"PE-RUC-2{index:010d}" for index in range(count)]


def write_signals_config(directory: Path, text: str = SIGNALS_TOML) -> Path:
    path = directory / "senales.toml"
    path.write_text(text, encoding="utf-8")
    return path


def read_results(data_dir: Path) -> list[dict[str, Any]]:
    con = duckdb.connect()
    relation = con.execute(f"SELECT * FROM read_parquet('{results_path(data_dir).as_posix()}')")
    columns = [description[0] for description in relation.description]
    rows = [dict(zip(columns, row, strict=True)) for row in relation.fetchall()]
    con.close()
    for row in rows:
        row["entradas"] = json.loads(row["entradas"])
    return rows


def prepare_data(
    tmp_path: Path, releases_2026: list[dict[str, Any]], releases_2025: list[dict[str, Any]]
) -> tuple[PipelineConfig, Path]:
    """Write the raw files (with a cut date of 4 October 2026) and run ingest and normalize."""
    data_dir = tmp_path / "data"
    filler_2025 = release("ocds-relleno-2025", **OTHER_REGION, **DATE_2025)
    filler_2026 = release("ocds-relleno-2026", **OTHER_REGION)
    write_jsonl_gz(data_dir / "raw" / "2025.jsonl.gz", releases_2025 or [filler_2025])
    write_jsonl_gz(data_dir / "raw" / "2026.jsonl.gz", releases_2026 or [filler_2026])
    for name in ("2025.jsonl.gz", "2026.jsonl.gz"):
        write_download_record(data_dir / "raw", name, f"{CUT_DATE}T08:58:49-05:00")
    config = load_config(write_config(tmp_path))
    ingest(config, data_dir)
    normalize(config, data_dir)
    return config, data_dir


def run_signals(
    tmp_path: Path,
    releases_2026: list[dict[str, Any]] | None = None,
    releases_2025: list[dict[str, Any]] | None = None,
    signals_text: str = SIGNALS_TOML,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    config, data_dir = prepare_data(tmp_path, releases_2026 or [], releases_2025 or [])
    settings = load_signals_config(write_signals_config(tmp_path, signals_text))
    manifest = compute_signals(config, settings, data_dir)
    return manifest, read_results(data_dir)


def by_code(rows: list[dict[str, Any]], code: str) -> list[dict[str, Any]]:
    return [row for row in rows if row["codigo"] == code]


def exclusion(manifest: dict[str, Any], code: str, reason: str) -> int:
    return next(
        item["cantidad"]
        for item in manifest["exclusiones"]
        if item["codigo"] == code and item["motivo"] == reason
    )
