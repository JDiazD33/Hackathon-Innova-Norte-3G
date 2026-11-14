"""Tests for S05 and S06 (task 6.1) and the entity types that S05 compares."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import duckdb
import pytest
from factories import award, contract, release
from signal_helpers import (
    SIGNALS_TOML,
    by_code,
    exclusion,
    prepare_data,
    run_signals,
    tenderers,
    write_signals_config,
)

from pipeline.config import ConfigError
from pipeline.entities import entity_type, entity_type_sql
from pipeline.export import build_package, validate_package
from pipeline.signals.compute import compute_signals
from pipeline.signals.s06 import percent
from pipeline.signals.settings import load_signals_config

# Small groups, so that a few synthetic entities are enough: groups of 4 entities, entities with
# 4 processes or more, and 2 direct contracts to flag.
S05_SMALL = (
    SIGNALS_TOML.replace("minimo_grupo = 30", "minimo_grupo = 4")
    .replace("minimo_procesos = 10", "minimo_procesos = 4")
    .replace("minimo_directas = 3", "minimo_directas = 2")
)
DIRECT = "Contratación Directa"
SECRET = b"secreto-de-prueba-0123456789"


def entity(
    number: int,
    name: str,
    direct: int,
    total: int = 6,
    department: str = "LA LIBERTAD",
    method: str | None = "Adjudicación Simplificada",
) -> list[dict[str, Any]]:
    """``total`` processes of PE-CONSUCODE-<number>; the first ``direct`` are direct contracts."""
    releases = []
    for index in range(total):
        is_direct = index < direct
        data = release(
            f"ocds-e{number}-{index:04d}",
            entity=f"PE-CONSUCODE-{number}",
            department=department,
            method=DIRECT if is_direct else method,
            method_ocds="direct" if is_direct else "open",
            tenderers=tenderers(2),
        )
        data["buyer"]["name"] = name
        releases.append(data)
    return releases


def municipalities(*shares: int) -> list[dict[str, Any]]:
    """Municipalities of La Libertad with 6 processes, ``shares`` of them direct."""
    return [
        data
        for offset, direct in enumerate(shares)
        for data in entity(11 + offset, f"MUNICIPALIDAD DISTRITAL DE PRUEBA {offset}", direct)
    ]


# --- Entity types ----------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("name", "kind"),
    [
        ("MUNICIPALIDAD DISTRITAL DE PRUEBA", "municipalidad"),
        ("Municipalidad Provincial de Prueba", "municipalidad"),
        ("UNIVERSIDAD NACIONAL DE PRUEBA", "universidad"),
        ("GOBIERNO REGIONAL DE PRUEBA - HOSPITAL", "gobierno regional"),
        ("PROGRAMA NACIONAL DE PRUEBA", "otro"),
        (None, "otro"),
    ],
)
def test_entity_type_is_the_same_in_python_and_sql(name: str | None, kind: str) -> None:
    assert entity_type(name) == kind
    (in_sql,) = duckdb.execute(
        f"SELECT {entity_type_sql('n')} FROM (SELECT ? AS n)", [name]
    ).fetchone()
    assert in_sql == kind


# --- S05 · Uso atípico de contratación directa --------------------------------------------


def test_s05_flags_an_entity_above_the_fence_of_its_type(tmp_path: Path) -> None:
    manifest, rows = run_signals(tmp_path, municipalities(6, 2, 1, 0, 0), signals_text=S05_SMALL)
    (signal,) = by_code(rows, "S05")
    assert signal["id"] == "S05-PE-CONSUCODE-11"
    assert signal["nivel"] == "entidad"
    assert signal["categoria"] == "competencia"
    assert signal["objeto"] == {"tipo": "entidad", "id": "PE-CONSUCODE-11"}
    assert signal["ocids"] == [f"ocds-e11-{index:04d}" for index in range(6)]
    assert signal["valor"] == 1.0
    # Shares 0, 0, 1/6, 2/6 and 1: Q3 = 1/3 and the fence is 1/3 + 1.5 × 1/3.
    assert signal["umbral"]["valor"] == pytest.approx(0.8333, abs=1e-4)
    assert signal["comparacion"]["ambito"] == "region"
    assert signal["comparacion"]["n"] == 5
    assert signal["comparacion"]["descripcion"] == (
        "Municipalidades de La Libertad con 4 procesos o más"
    )
    assert signal["entradas"]["tipo_entidad"] == "municipalidad"
    assert signal["entradas"]["procesos_directos"] == 6
    assert manifest["conteos"]["S05"] == 1


def test_s05_compares_with_the_whole_country_when_the_region_has_few_entities(
    tmp_path: Path,
) -> None:
    others = [
        data
        for offset, direct in enumerate((2, 1, 0, 0))
        for data in entity(
            31 + offset, f"UNIVERSIDAD DE PRUEBA {offset}", direct, department="PIURA"
        )
    ]
    releases = [*entity(21, "UNIVERSIDAD NACIONAL DE PRUEBA", 6), *others]
    _, rows = run_signals(tmp_path, releases, signals_text=S05_SMALL)
    (signal,) = by_code(rows, "S05")
    assert signal["entidad_id"] == "PE-CONSUCODE-21"
    assert signal["comparacion"]["ambito"] == "nacional"
    assert signal["comparacion"]["n"] == 5
    assert signal["comparacion"]["descripcion"] == (
        "Universidades de todo el país con 4 procesos o más"
    )


def test_s05_does_not_flag_entities_under_the_fence(tmp_path: Path) -> None:
    _, rows = run_signals(tmp_path, municipalities(2, 2, 1, 0, 0), signals_text=S05_SMALL)
    assert by_code(rows, "S05") == []


def test_s05_needs_the_minimum_of_direct_contracts_even_over_a_zero_fence(
    tmp_path: Path,
) -> None:
    # Four municipalities without direct contracts leave the fence at 0.
    _, rows = run_signals(tmp_path, municipalities(1, 0, 0, 0, 0), signals_text=S05_SMALL)
    assert by_code(rows, "S05") == []


def test_s05_counts_processes_without_method_and_small_entities(tmp_path: Path) -> None:
    releases = [
        *municipalities(6, 2, 1, 0, 0),
        *entity(16, "MUNICIPALIDAD SIN METODO", 0, method=None),
        *entity(17, "MUNICIPALIDAD PEQUEÑA", 2, total=3),
    ]
    manifest, rows = run_signals(tmp_path, releases, signals_text=S05_SMALL)
    assert exclusion(manifest, "S05", "proceso sin método") == 6
    assert exclusion(manifest, "S05", "entidad con menos de 4 procesos") == 1
    assert [signal["entidad_id"] for signal in by_code(rows, "S05")] == ["PE-CONSUCODE-11"]


def test_s05_is_shown_on_the_entity_and_adds_to_no_process(tmp_path: Path) -> None:
    config, data_dir = prepare_data(tmp_path, municipalities(6, 2, 1, 0, 0), [])
    settings = load_signals_config(write_signals_config(tmp_path, S05_SMALL))
    compute_signals(config, settings, data_dir)
    files = build_package(config, settings, data_dir, "publico", SECRET)
    validate_package(files)
    panel = next(item for item in files["entidades.json"] if item["id"] == "PE-CONSUCODE-11")
    assert panel["senales_entidad"] == ["S05-PE-CONSUCODE-11"]
    for process in files["procesos/PE-CONSUCODE-11.json"]:
        assert "S05-PE-CONSUCODE-11" not in process["senales"]
        breakdown = (process["prioridad"] or {}).get("desglose", [])
        assert all(entry["codigo"] != "S05" for entry in breakdown)


# --- S06 · Monto final mayor que el contratado --------------------------------------------


def awarded(ocid: str, final_amount: float | None, amount: float = 1000.0) -> dict[str, Any]:
    return release(
        ocid,
        tenderers=tenderers(2),
        awards=[award("a1", amount=amount)],
        contracts=[contract("c1", "a1", amount=amount, final_amount=final_amount)],
    )


def test_percent_is_written_as_in_spanish() -> None:
    assert percent(1 / 11) == "9,1 %"
    assert percent(0.10) == "10 %"
    assert percent(0) == "0 %"


def test_s06_is_deactivated_when_few_contracts_have_a_final_amount(tmp_path: Path) -> None:
    releases = [awarded("ocds-k-0000", 1500.0)]
    releases += [awarded(f"ocds-k-{index:04d}", None) for index in range(1, 11)]
    manifest, rows = run_signals(tmp_path, releases)
    assert "S06" not in manifest["senales_activas"]
    assert {
        "codigo": "S06",
        "motivo": (
            "Solo el 9,1 % de los contratos de La Libertad tiene monto final "
            "(contracts[].implementation.finalValue); el mínimo es 10 %."
        ),
    } in manifest["senales_desactivadas"]
    assert by_code(rows, "S06") == []


def test_s06_flags_a_final_amount_over_the_factor(tmp_path: Path) -> None:
    releases = [
        awarded("ocds-k-0001", 1200.0),
        awarded("ocds-k-0002", 1100.0),
        awarded("ocds-k-0003", None),
    ]
    manifest, rows = run_signals(tmp_path, releases)
    assert "S06" in manifest["senales_activas"]
    (signal,) = by_code(rows, "S06")
    assert signal["id"] == "S06-ocds-k-0001-c1"
    assert signal["nivel"] == "proceso"
    assert signal["objeto"] == {"tipo": "proceso", "id": "ocds-k-0001"}
    assert signal["ocids"] == ["ocds-k-0001"]
    assert signal["valor"] == 1.2
    assert signal["umbral"]["operador"] == "mayor_o_igual"
    assert signal["umbral"]["valor"] == 1.15
    assert signal["comparacion"] is None
    assert signal["entradas"]["monto_contratado"] == 1000.0
    assert signal["entradas"]["monto_final"] == 1200.0
    assert exclusion(manifest, "S06", "contrato sin monto final") == 1


# --- Configuration ----------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("old", "new", "message"),
    [
        (
            'metodos_directos = ["Contratación Directa"]',
            'metodos_directos = ["Licitación Pública"]',
            r"S05\.metodos_directos",
        ),
        ("minimo_directas = 3", "minimo_directas = 0", r"S05\.minimo_directas"),
        ("factor = 1.15", "factor = 0.9", r"S06\.factor"),
        ("cobertura_minima = 0.10", "cobertura_minima = 1.5", r"S06\.cobertura_minima"),
    ],
)
def test_invalid_s05_or_s06_config_is_rejected(
    tmp_path: Path, old: str, new: str, message: str
) -> None:
    assert old in SIGNALS_TOML
    path = write_signals_config(tmp_path, SIGNALS_TOML.replace(old, new))
    with pytest.raises(ConfigError, match=message):
        load_signals_config(path)
