"""Fingerprints of the pipeline outputs (task 7.1): the SHA-256 of every file the chain writes.

Two runs with the same raw files, configuration and ``PSEUDONYM_SECRET`` must give the same
fingerprints. JSON files are hashed without their generation time (``generado``), the only value
expected to change between runs; every other file is hashed byte by byte.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

from pipeline import cardinal, ingest
from pipeline.export import MODES
from pipeline.normalize import manifest_path, tables_dir
from pipeline.signals.compute import results_path, signals_dir, signals_manifest_path
from pipeline.signals.s08 import case_files_path

TIMESTAMP_KEYS = frozenset({"generado"})


def output_files(data_dir: Path, web_data_dir: Path) -> dict[str, Path]:
    """The outputs of ingest, normalize, signals, cardinal and export that exist, by name."""
    interim = data_dir / "interim"
    signals = signals_dir(data_dir)
    data_files = [
        interim / ingest.INTERIM_FILE,
        interim / ingest.NATIONAL_FILE,
        interim / ingest.SUMMARY_FILE,
        *sorted(tables_dir(data_dir).glob("*.parquet")),
        manifest_path(data_dir),
        results_path(data_dir),
        signals_manifest_path(data_dir),
        case_files_path(signals),
        interim / cardinal.INPUT_FILE,
        interim / cardinal.SETTINGS_FILE,
        signals / cardinal.REPORT_FILE,
    ]
    files = {
        f"data/{path.relative_to(data_dir).as_posix()}": path
        for path in data_files
        if path.exists()
    }
    for mode in MODES:
        for path in sorted((web_data_dir / mode).rglob("*.json")):
            files[f"web/data/{path.relative_to(web_data_dir).as_posix()}"] = path
    return files


def _without_timestamps(value: Any) -> Any:
    if isinstance(value, dict):
        return {
            key: _without_timestamps(item)
            for key, item in value.items()
            if key not in TIMESTAMP_KEYS
        }
    if isinstance(value, list):
        return [_without_timestamps(item) for item in value]
    return value


def file_fingerprint(path: Path) -> str:
    """SHA-256 of a file; for JSON, of its content without ``generado``."""
    if path.suffix == ".json":
        data = _without_timestamps(json.loads(path.read_text(encoding="utf-8")))
        payload = json.dumps(data, ensure_ascii=False, sort_keys=True).encode("utf-8")
        return hashlib.sha256(payload).hexdigest()
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def fingerprints(data_dir: Path, web_data_dir: Path) -> dict[str, str]:
    """Fingerprint of every output, by name (``data/...`` or ``web/data/...``)."""
    files = output_files(data_dir, web_data_dir)
    if not files:
        raise FileNotFoundError(
            f"No hay salidas del pipeline en {data_dir} ni en {web_data_dir}. "
            "Ejecuta antes la cadena (ingest, normalize, signals, cardinal y export)."
        )
    return {name: file_fingerprint(path) for name, path in files.items()}


def compare(current: dict[str, str], previous: dict[str, str]) -> list[str]:
    """One line per difference between two runs; an empty list means identical outputs."""
    lines = []
    for name in sorted(current.keys() | previous.keys()):
        if name not in previous:
            lines.append(f"solo en esta ejecución: {name}")
        elif name not in current:
            lines.append(f"falta en esta ejecución: {name}")
        elif current[name] != previous[name]:
            lines.append(f"distinto: {name}")
    return lines


def write_fingerprints(values: dict[str, str], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps({"archivos": values}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def read_fingerprints(path: Path) -> dict[str, str]:
    return json.loads(path.read_text(encoding="utf-8"))["archivos"]
