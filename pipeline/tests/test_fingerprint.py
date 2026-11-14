"""Tests for the output fingerprints used to check that two runs give the same results (7.1)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from pipeline.cli import main
from pipeline.fingerprint import compare, file_fingerprint, fingerprints


def write_json(path: Path, data: dict) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data), encoding="utf-8")
    return path


def outputs(tmp_path: Path) -> tuple[Path, Path]:
    """A data folder and a web data folder with one output of each kind."""
    data_dir, web_dir = tmp_path / "data", tmp_path / "web-data"
    table = data_dir / "derived" / "tablas" / "procesos.parquet"
    table.parent.mkdir(parents=True)
    table.write_bytes(b"PAR1 tabla de prueba")
    write_json(data_dir / "derived" / "tablas" / "manifiesto.json", {"generado": "1", "n": 3})
    write_json(web_dir / "publico" / "manifest.json", {"generado": "1", "modo": "publico"})
    write_json(web_dir / "local" / "procesos" / "PE-CONSUCODE-1.json", {"ocid": "ocds-1"})
    return data_dir, web_dir


def test_generation_time_does_not_change_a_json_fingerprint(tmp_path: Path) -> None:
    first = write_json(tmp_path / "a.json", {"generado": "2026-11-14T10:00:00-05:00", "n": 1})
    second = write_json(tmp_path / "b.json", {"n": 1, "generado": "2026-11-14T11:30:00-05:00"})
    changed = write_json(tmp_path / "c.json", {"generado": "2026-11-14T10:00:00-05:00", "n": 2})
    assert file_fingerprint(first) == file_fingerprint(second)
    assert file_fingerprint(first) != file_fingerprint(changed)


def test_fingerprints_name_every_output_and_compare_finds_changes(tmp_path: Path) -> None:
    data_dir, web_dir = outputs(tmp_path)
    before = fingerprints(data_dir, web_dir)
    assert sorted(before) == [
        "data/derived/tablas/manifiesto.json",
        "data/derived/tablas/procesos.parquet",
        "web/data/local/procesos/PE-CONSUCODE-1.json",
        "web/data/publico/manifest.json",
    ]
    (data_dir / "derived" / "tablas" / "procesos.parquet").write_bytes(b"PAR1 otra tabla")
    (web_dir / "local" / "procesos" / "PE-CONSUCODE-1.json").unlink()
    write_json(web_dir / "publico" / "entidades.json", [])
    assert compare(fingerprints(data_dir, web_dir), before) == [
        "distinto: data/derived/tablas/procesos.parquet",
        "falta en esta ejecución: web/data/local/procesos/PE-CONSUCODE-1.json",
        "solo en esta ejecución: web/data/publico/entidades.json",
    ]


def test_fingerprints_without_outputs_stop_with_a_message(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError, match="No hay salidas del pipeline"):
        fingerprints(tmp_path / "data", tmp_path / "web-data")


def test_cli_fingerprint_compares_two_runs(tmp_path: Path, capsys) -> None:
    data_dir, web_dir = outputs(tmp_path)
    folders = ["--data-dir", str(data_dir), "--web-data-dir", str(web_dir)]
    saved = tmp_path / "huellas-1.json"
    assert main(["fingerprint", *folders, "--out", str(saved)]) == 0
    assert "Huellas de 4 archivos" in capsys.readouterr().out
    write_json(data_dir / "derived" / "tablas" / "manifiesto.json", {"generado": "2", "n": 3})
    assert main(["fingerprint", *folders, "--compare", str(saved)]) == 0
    assert "Idénticas a" in capsys.readouterr().out
    write_json(web_dir / "publico" / "manifest.json", {"generado": "1", "modo": "local"})
    assert main(["fingerprint", *folders, "--compare", str(saved)]) == 1
    assert "distinto: web/data/publico/manifest.json" in capsys.readouterr().out
    assert (
        main(
            [
                "fingerprint",
                "--data-dir",
                str(tmp_path / "vacio"),
                "--web-data-dir",
                str(tmp_path / "vacio-web"),
            ]
        )
        == 1
    )
    assert "No hay salidas del pipeline" in capsys.readouterr().err
