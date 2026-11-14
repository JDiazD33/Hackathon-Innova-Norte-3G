"""Tests for the contrast with Cardinal (task 4.4)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from factories import item, release
from signal_helpers import prepare_data, tenderers, write_signals_config

from pipeline.cardinal import INPUT_FILE, NOT_INSTALLED, compare, contrast, find_cardinal
from pipeline.cli import main
from pipeline.signals.compute import compute_signals
from pipeline.signals.settings import load_signals_config

CARDINAL = find_cardinal()


def single_tenderer_data(tmp_path: Path):
    group = [release(f"ocds-g-{i:04d}", tenderers=tenderers(3)) for i in range(30)]
    releases = [
        *group,
        release("ocds-uno-0001", tenderers=tenderers(1)),
        release(
            "ocds-cancelado-0001", tenderers=tenderers(1), items=[item(status_details="CANCELADO")]
        ),
    ]
    config, data_dir = prepare_data(tmp_path, releases, [])
    settings = load_signals_config(write_signals_config(tmp_path))
    compute_signals(config, settings, data_dir)
    return config, settings, data_dir


def test_compare_lists_coincidences_and_differences() -> None:
    signal = {f"ocid-{i:03d}" for i in range(120)}
    cardinal = {f"ocid-{i:03d}" for i in range(115)}
    result = compare(signal, cardinal, {"ocid-119": "motivo de prueba"})
    assert result["coincidencias"] == 115
    assert result["porcentaje_coincidencia"] == 95.8
    assert [case["ocid"] for case in result["solo_senal"]] == [
        f"ocid-{i:03d}" for i in range(115, 120)
    ]
    assert result["solo_senal"][-1]["motivo"] == "motivo de prueba"
    assert result["solo_cardinal"] == []


def test_contrast_without_cardinal_says_why(tmp_path: Path) -> None:
    config, settings, data_dir = single_tenderer_data(tmp_path)
    report = contrast(config, settings, data_dir, binary=None)
    assert report["contraste"] == "no fue posible"
    assert report["motivo"] == NOT_INSTALLED
    lines = (data_dir / "interim" / INPUT_FILE).read_text(encoding="utf-8").splitlines()
    assert len(lines) == 32
    first = json.loads(lines[0])
    assert first["tender"]["procurementMethod"] == "open"
    assert first["tender"]["tenderPeriod"]["startDate"].endswith("T00:00:00-05:00")


def test_contrast_needs_the_signals(tmp_path: Path) -> None:
    config, data_dir = prepare_data(tmp_path, [release("ocds-uno-0001")], [])
    with pytest.raises(FileNotFoundError, match="pipeline signals"):
        contrast(config, load_signals_config(), data_dir, binary=None)


@pytest.mark.skipif(CARDINAL is None, reason="la herramienta de Cardinal no está instalada")
def test_contrast_with_cardinal(tmp_path: Path) -> None:
    config, settings, data_dir = single_tenderer_data(tmp_path)
    report = contrast(config, settings, data_dir, binary=CARDINAL)
    assert report["herramienta"].startswith("ocdscardinal")
    r018 = report["R018"]
    assert r018["senal"] == 1
    assert r018["cardinal"] == 2
    assert r018["coincidencias"] == 1
    assert r018["solo_cardinal"] == [
        {"ocid": "ocds-cancelado-0001", "motivo": "S01 no evalúa procesos en estado CANCELADO"}
    ]
    r003 = report["R003"]
    assert r003["contraste"] == "no fue posible"
    assert r003["motivo"].startswith("S02 está desactivada")
    assert r003["cardinal"] == 32
    assert r003["procesos_con_tenderPeriod"] == 32


def test_cli_cardinal_without_the_tool(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    _, _, data_dir = single_tenderer_data(tmp_path)
    arguments = [
        "--config",
        str(tmp_path / "pipeline.toml"),
        "--signals-config",
        str(tmp_path / "senales.toml"),
        "--data-dir",
        str(data_dir),
        "--cardinal",
        str(tmp_path / "no-existe.exe"),
    ]
    assert main(["cardinal", *arguments]) == 0
    assert "Contraste no realizado" in capsys.readouterr().out
