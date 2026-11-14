"""Tests for S03, S04 and S08 (tasks 4.1 to 4.3)."""

from __future__ import annotations

import hashlib
import json
from datetime import date
from pathlib import Path
from typing import Any

import pytest
from factories import award, contract, item, release
from signal_helpers import (
    SIGNALS_TOML,
    by_code,
    exclusion,
    prepare_data,
    read_results,
    run_signals,
    tenderers,
    write_signals_config,
)

from pipeline.config import ConfigError
from pipeline.signals.compute import compute_signals, signals_dir
from pipeline.signals.s03 import months_before, window
from pipeline.signals.s08 import CASE_FILES
from pipeline.signals.settings import load_signals_config

AWARD_DATE = "2026-03-12T10:00:00-05:00"
THRESHOLD = (
    '{ metodo = "Adjudicación Simplificada", objeto = "bienes", anio = 2026, '
    'umbral_pen = 150000.0, norma = "Norma de prueba", verificado = "2026-11-14" }'
)
S04_ACTIVE = SIGNALS_TOML.replace("[S04]\nactiva = false", "[S04]\nactiva = true").replace(
    "umbrales = []", f"umbrales = [\n  {THRESHOLD},\n]"
)


def supplier(number: int) -> str:
    return f"PE-RUC-20{number:09d}"


def won(ocid: str, winner: str | None, entity: str = "PE-CONSUCODE-1", **kwargs: Any) -> dict:
    """A process of ``entity`` won by ``winner`` (None: an award without supplier)."""
    suppliers = (winner,) if winner else ()
    return release(
        ocid,
        entity=entity,
        tenderers=tenderers(2),
        awards=[award("a1", suppliers, amount=1000.0, date=kwargs.pop("award_date", AWARD_DATE))],
        **kwargs,
    )


def purchase(ocid: str, published: str, amount: float = 100000.0, **kwargs: Any) -> dict:
    """An abbreviated purchase of goods with UNSPSC class 421115."""
    return release(ocid, published=published, amount=amount, tenderers=tenderers(2), **kwargs)


# --- S03 -----------------------------------------------------------------------------------


def test_window_ends_on_the_cut_date() -> None:
    assert window(date(2026, 10, 4), 12) == (date(2025, 10, 5), date(2026, 10, 4))
    assert months_before(date(2026, 3, 31), 1) == date(2026, 2, 28)


def test_s03_flags_an_atypical_share_and_lists_the_processes(tmp_path: Path) -> None:
    dominant = [won(f"ocds-a-{i:04d}", supplier(1)) for i in range(9)]
    others = [won(f"ocds-o-{i:04d}", supplier(2 + i)) for i in range(3)]
    manifest, rows = run_signals(tmp_path, dominant + others)
    (signal,) = by_code(rows, "S03")
    assert signal["id"] == f"S03-{supplier(1)}-PE-CONSUCODE-1"
    assert signal["nivel"] == "proveedor_entidad"
    assert signal["objeto"] == {"tipo": "proveedor", "id": supplier(1)}
    assert signal["ocids"] == sorted(f"ocds-a-{i:04d}" for i in range(9))
    assert signal["valor"] == 0.75
    assert signal["unidad"] == "participación en el monto adjudicado"
    assert signal["umbral"]["operador"] == "mayor_que"
    assert signal["umbral"]["valor"] == 0.5
    assert signal["comparacion"]["n"] == 4
    assert signal["comparacion"]["valla_superior"] == 0.5
    assert signal["comparacion"]["percentil_del_caso"] == 100.0
    assert signal["entradas"]["procesos_ganados"] == 9
    assert signal["entradas"]["procesos_entidad"] == 12
    assert signal["entradas"]["ventana_inicio"] == "2025-10-05"
    assert signal["version_regla"] == "S03@1"
    assert manifest["parametros"]["S03"]["ventana_fin"] == "2026-10-04"


def test_s03_needs_a_minimum_of_awards(tmp_path: Path) -> None:
    many = [won(f"ocds-m-{i:04d}", supplier(10 + i), entity="PE-CONSUCODE-2") for i in range(10)]
    twice = [won(f"ocds-x-{i:04d}", supplier(1), entity="PE-CONSUCODE-2") for i in range(2)]
    _, rows = run_signals(tmp_path, many + twice)
    assert by_code(rows, "S03") == []


def test_s03_counts_what_it_cannot_evaluate(tmp_path: Path) -> None:
    manifest, _ = run_signals(
        tmp_path,
        [
            won("ocds-sin-proveedor-0001", None),
            won("ocds-antigua-0001", supplier(1), award_date="2024-01-15T10:00:00-05:00"),
        ],
    )
    assert exclusion(manifest, "S03", "adjudicación sin proveedor") == 1
    assert exclusion(manifest, "S03", "adjudicación fuera de la ventana") == 1


# --- S04 -----------------------------------------------------------------------------------


def test_s04_flags_purchases_within_the_window(tmp_path: Path) -> None:
    _, rows = run_signals(
        tmp_path,
        [
            purchase("ocds-c-0001", "2026-03-02T10:00:00-05:00"),
            purchase("ocds-c-0002", "2026-03-22T10:00:00-05:00"),
            purchase("ocds-c-0003", "2026-07-20T10:00:00-05:00"),
        ],
        signals_text=S04_ACTIVE,
    )
    (signal,) = by_code(rows, "S04")
    assert signal["ocids"] == ["ocds-c-0001", "ocds-c-0002"]
    assert signal["nivel"] == "grupo"
    assert signal["valor"] == 200000.0
    assert signal["unidad"] == "soles"
    assert signal["umbral"]["valor"] == 150000.0
    assert "Norma de prueba" in signal["umbral"]["descripcion"]
    assert signal["entradas"]["clase_item"] == "421115"
    assert signal["entradas"]["dias_entre_convocatorias"] == 20
    assert signal["entradas"]["fechas"] == ["2026-03-02", "2026-03-22"]
    assert signal["comparacion"] is None


def test_s04_ignores_purchases_outside_the_window(tmp_path: Path) -> None:
    _, rows = run_signals(
        tmp_path,
        [
            purchase("ocds-c-0001", "2026-03-02T10:00:00-05:00"),
            purchase("ocds-c-0002", "2026-06-30T10:00:00-05:00"),
        ],
        signals_text=S04_ACTIVE,
    )
    assert by_code(rows, "S04") == []


def test_s04_window_change_changes_results_and_version(tmp_path: Path) -> None:
    config, data_dir = prepare_data(
        tmp_path,
        [
            purchase("ocds-c-0001", "2026-03-02T10:00:00-05:00"),
            purchase("ocds-c-0002", "2026-03-22T10:00:00-05:00"),
            purchase("ocds-c-0003", "2026-04-16T10:00:00-05:00"),
        ],
        [],
    )
    compute_signals(
        config, load_signals_config(write_signals_config(tmp_path, S04_ACTIVE)), data_dir
    )
    (group,) = by_code(read_results(data_dir), "S04")
    assert group["ocids"] == ["ocds-c-0001", "ocds-c-0002", "ocds-c-0003"]
    assert group["version_regla"] == "S04@1"

    shorter = S04_ACTIVE.replace("version = 1\nventana_dias = 60", "version = 2\nventana_dias = 30")
    compute_signals(config, load_signals_config(write_signals_config(tmp_path, shorter)), data_dir)
    groups = by_code(read_results(data_dir), "S04")
    assert [group["ocids"] for group in groups] == [
        ["ocds-c-0001", "ocds-c-0002"],
        ["ocds-c-0002", "ocds-c-0003"],
    ]
    assert {group["version_regla"] for group in groups} == {"S04@2"}


def test_s04_counts_processes_without_classification(tmp_path: Path) -> None:
    manifest, rows = run_signals(
        tmp_path,
        [purchase("ocds-c-0001", "2026-03-02T10:00:00-05:00", items=[item(cubso=None)])],
        signals_text=S04_ACTIVE,
    )
    assert by_code(rows, "S04") == []
    assert exclusion(manifest, "S04", "sin clasificación UNSPSC") == 1


def test_s04_needs_thresholds_when_active(tmp_path: Path) -> None:
    text = SIGNALS_TOML.replace("[S04]\nactiva = false", "[S04]\nactiva = true")
    with pytest.raises(ConfigError, match="no tiene umbrales"):
        load_signals_config(write_signals_config(tmp_path, text))
    bad = S04_ACTIVE.replace('objeto = "bienes"', 'objeto = "otros"')
    with pytest.raises(ConfigError, match=r"umbrales\[1\]\.objeto"):
        load_signals_config(write_signals_config(tmp_path, bad))


# --- S08 -----------------------------------------------------------------------------------


def contracted(count: int) -> list[dict[str, Any]]:
    return [
        release(
            f"ocds-k-{i:04d}",
            tenderers=tenderers(2),
            awards=[award("a1", (supplier(100 + i),))],
            contracts=[contract("c1", "a1")],
        )
        for i in range(count)
    ]


def test_s08_runs_only_on_simulated_case_files(tmp_path: Path) -> None:
    config, data_dir = prepare_data(tmp_path, [*contracted(10), release("ocds-sin-k-0001")], [])
    settings = load_signals_config(write_signals_config(tmp_path))
    manifest = compute_signals(config, settings, data_dir)
    case_files = json.loads((signals_dir(data_dir) / CASE_FILES).read_text(encoding="utf-8"))
    assert len(case_files) == 8
    assert all(case_file["simulado"] is True for case_file in case_files)
    assert {case_file["ocid"] for case_file in case_files} <= {f"ocds-k-{i:04d}" for i in range(10)}
    signals = by_code(read_results(data_dir), "S08")
    assert len(signals) == 6
    assert all(signal["simulado"] is True for signal in signals)
    concentrated = [s for s in signals if s["entradas"]["misma_persona"]]
    assert len(concentrated) == 3
    assert concentrated[0]["entradas"]["persona"].startswith("Persona ")
    assert exclusion(manifest, "S08", "sin expediente simulado") == 3
    assert manifest["expedientes_simulados"] == 8


def test_s08_case_files_are_reproducible(tmp_path: Path) -> None:
    config, data_dir = prepare_data(tmp_path, contracted(10), [])
    settings = load_signals_config(write_signals_config(tmp_path))
    path = signals_dir(data_dir) / CASE_FILES
    compute_signals(config, settings, data_dir)
    first = hashlib.sha256(path.read_bytes()).hexdigest()
    compute_signals(config, settings, data_dir)
    assert hashlib.sha256(path.read_bytes()).hexdigest() == first


def test_s08_uses_the_chosen_processes(tmp_path: Path) -> None:
    config, data_dir = prepare_data(tmp_path, contracted(4), [])
    chosen = SIGNALS_TOML.replace("procesos = []", 'procesos = ["ocds-k-0002", "ocds-k-0003"]')
    compute_signals(config, load_signals_config(write_signals_config(tmp_path, chosen)), data_dir)
    case_files = json.loads((signals_dir(data_dir) / CASE_FILES).read_text(encoding="utf-8"))
    assert [case_file["ocid"] for case_file in case_files] == ["ocds-k-0002", "ocds-k-0003"]

    missing = SIGNALS_TOML.replace("procesos = []", 'procesos = ["ocds-no-existe"]')
    with pytest.raises(ValueError, match="ocds-no-existe"):
        compute_signals(
            config, load_signals_config(write_signals_config(tmp_path, missing)), data_dir
        )
