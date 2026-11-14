"""Tests for the priority, the pseudonyms and the data package (tasks 5.1 to 5.3)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest
from factories import award, contract, release
from signal_helpers import prepare_data, tenderers, write_signals_config

from pipeline.cli import main
from pipeline.config import PipelineConfig
from pipeline.export import (
    ExportError,
    NameIndex,
    build_package,
    export,
    load_secret,
    priority,
    pseudonyms,
    redact,
    validate_package,
)
from pipeline.signals.compute import compute_signals
from pipeline.signals.settings import SignalsConfig, load_signals_config

SECRET = b"secreto-de-prueba-0123456789"
WEIGHTS = {"S01": 3, "S02": 2, "S03": 3, "S04": 3, "S06": 2, "S07": 3, "S08": 3}
CUTS = {"alta": 5, "media": 3}

COMPANY = "PE-RUC-20000000001"
PERSON = "PE-RUC-10000000002"
FOREIGNER = "PE-RUC-L0000000003"
# Consortia get a short code and are often named after a place, as in the source.
CONSORTIUM = "PE-RUC-1700001"
NAMES = {
    COMPANY: "CONSTRUCTORA ANDINA SAC",
    PERSON: "JUAN PEREZ GOMEZ",
    FOREIGNER: "ANA PRUEBA EXTRANJERA",
    CONSORTIUM: "RIO SECO",
}
UNRELATED_DESCRIPTION = (
    "PLAN DE NEGOCIO DE CONSTRUCTORA ANDINA SAC. Y DE Juan Pérez  Gómez, CON ANA PRUEBA EXTRANJERA"
)


def named(data: dict[str, Any]) -> dict[str, Any]:
    """Give the test suppliers their names in tenderers and awards."""
    for tenderer in data["tender"].get("tenderers", []):
        tenderer["name"] = NAMES.get(tenderer["id"], tenderer["name"])
    for item in data.get("awards", []):
        for supplier in item["suppliers"]:
            supplier["name"] = NAMES.get(supplier["id"], supplier["name"])
    return data


def won(ocid: str, winner: str, participants: list[str], **kwargs: Any) -> dict[str, Any]:
    return named(
        release(
            ocid,
            tenderers=participants,
            awards=[award("a1", (winner,))],
            contracts=[contract("c1", "a1")],
            **kwargs,
        )
    )


@pytest.fixture
def package_data(tmp_path: Path) -> tuple[PipelineConfig, SignalsConfig, Path]:
    """Entity PE-CONSUCODE-1: the company wins 4 of 10 processes (S03) and one with a single
    tenderer (S01); a natural person and a consortium win others, and a foreigner without RUC
    takes part in ocds-o-0002. Descriptions name them: ocds-o-0000 names the company, the person
    and the foreigner, and ocds-o-0001 the place of the consortium, although none takes part."""
    others = [won(f"ocds-o-{i:04d}", f"PE-RUC-2{i + 10:010d}", tenderers(3)) for i in range(6)]
    others[0]["tender"]["description"] = UNRELATED_DESCRIPTION
    others[0]["tender"]["tenderers"][1] = {"id": "PE-RUC-20000000099", "name": "PROVEEDOR 0099"}
    others[1]["tender"]["description"] = "CANAL RIO SECO"
    others[2]["tender"]["tenderers"][0] = {"id": FOREIGNER, "name": NAMES[FOREIGNER]}
    releases = [
        won(
            "ocds-p-0001",
            COMPANY,
            [COMPANY],
            description=f"OBRA CON {NAMES[COMPANY]} RUC 20000000001",
        ),
        *[won(f"ocds-p-000{i}", COMPANY, [COMPANY, *tenderers(2)]) for i in (2, 3, 4)],
        won(
            "ocds-n-0001",
            PERSON,
            [PERSON, COMPANY],
            description=f"SERVICIO DE {NAMES[PERSON]} CON DNI EN RUC 10000000002",
        ),
        won("ocds-c-0001", CONSORTIUM, [CONSORTIUM, COMPANY], description="OBRA DE RIO SECO"),
        *others,
    ]
    config, data_dir = prepare_data(tmp_path, releases, [])
    settings = load_signals_config(write_signals_config(tmp_path))
    compute_signals(config, settings, data_dir)
    return config, settings, data_dir


def read_package(out_dir: Path) -> dict[str, Any]:
    return {
        path.relative_to(out_dir).as_posix(): json.loads(path.read_text(encoding="utf-8"))
        for path in out_dir.rglob("*.json")
    }


def all_processes(files: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        process["ocid"]: process
        for path, data in files.items()
        if path.startswith("procesos/")
        for process in data
    }


def all_signals(files: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {
        signal["id"]: signal
        for path, data in files.items()
        if path.startswith("senales/")
        for signal in data
    }


# --- 5.1 · Priority ----------------------------------------------------------------------


def test_priority_adds_the_weights_and_keeps_the_breakdown() -> None:
    assert priority(["S01", "S03"], WEIGHTS, CUTS) == {
        "puntaje": 6,
        "nivel": "alta",
        "desglose": [{"codigo": "S01", "peso": 3}, {"codigo": "S03", "peso": 3}],
    }
    assert priority(["S08"], WEIGHTS, CUTS)["nivel"] == "media"
    assert priority(["S02"], WEIGHTS, CUTS)["nivel"] == "baja"


def test_process_without_signals_has_no_priority() -> None:
    assert priority([], WEIGHTS, CUTS) is None
    assert priority(["S05"], WEIGHTS, CUTS) is None


# --- 5.2 · Pseudonyms and natural persons --------------------------------------------------


def test_pseudonyms_depend_only_on_the_suppliers_and_the_secret() -> None:
    keys = {f"PE-RUC-2{i:010d}": f"2{i:010d}" for i in range(12)}
    first = pseudonyms(keys, SECRET)
    assert pseudonyms(keys, SECRET) == first
    assert sorted(first.values()) == [f"P{i:04d}" for i in range(1, 13)]
    assert pseudonyms(keys, b"otro-secreto-0123456789") != first


def test_secret_comes_from_the_environment_or_the_env_file(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("PSEUDONYM_SECRET", raising=False)
    with pytest.raises(ExportError, match="PSEUDONYM_SECRET"):
        load_secret(tmp_path / "no-existe.env")
    env_file = tmp_path / ".env"
    env_file.write_text("OTRA=1\nPSEUDONYM_SECRET=abcdefghijklmnop123\n", encoding="utf-8")
    assert load_secret(env_file) == b"abcdefghijklmnop123"
    monkeypatch.setenv("PSEUDONYM_SECRET", "corto")
    with pytest.raises(ExportError, match="al menos 16"):
        load_secret(tmp_path / "no-existe.env")


def test_redact_hides_whole_names_ignoring_case_accents_and_spaces() -> None:
    index = NameIndex(["JUAN PÉREZ GÓMEZ", "SAN MARTIN", "SAN MARTIN SAC"])
    assert (
        redact("Servicio de juan  perez gomez, RUC 10000000002", index)
        == "Servicio de [proveedor], RUC [RUC omitido]"
    )
    assert redact("Obra de SAN MARTIN SAC.", index) == "Obra de [proveedor]."


def test_redact_keeps_words_that_only_contain_a_name() -> None:
    index = NameIndex(["SAN MARTIN"])
    assert redact("Calle San Martinez y Pasaje SANSAN MARTIN", index) == (
        "Calle San Martinez y Pasaje SANSAN MARTIN"
    )
    assert redact("Contrato 2000000000123", index) == "Contrato 2000000000123"


def test_redact_without_names_or_text() -> None:
    assert redact("", NameIndex([None, "", "  "])) == ""
    assert redact("Obra de ABC", NameIndex(["ABC"])) == "Obra de ABC"
    assert NameIndex(["JUAN"], minimum_words=2).candidates("JUAN") == set()


def test_supplier_names_are_hidden_in_every_text(package_data, tmp_path: Path) -> None:
    config, settings, data_dir = package_data
    export(config, settings, data_dir, "publico", tmp_path / "publico", SECRET)
    public = all_processes(read_package(tmp_path / "publico"))["ocds-o-0000"]
    assert public["descripcion"] == (
        "PLAN DE NEGOCIO DE [proveedor]. Y DE [proveedor], CON [proveedor]"
    )
    export(config, settings, data_dir, "local", tmp_path / "local", SECRET)
    local = all_processes(read_package(tmp_path / "local"))["ocds-o-0000"]
    assert local["descripcion"] == (
        "PLAN DE NEGOCIO DE CONSTRUCTORA ANDINA SAC. Y DE [proveedor], CON [proveedor]"
    )


def test_consortium_names_are_hidden_only_in_their_own_processes(
    package_data, tmp_path: Path
) -> None:
    config, settings, data_dir = package_data
    for mode in ("publico", "local"):
        export(config, settings, data_dir, mode, tmp_path / mode, SECRET)
        processes = all_processes(read_package(tmp_path / mode))
        assert processes["ocds-c-0001"]["descripcion"] == "OBRA DE [proveedor]", mode
        assert processes["ocds-o-0001"]["descripcion"] == "CANAL RIO SECO", mode


def test_public_package_has_no_supplier_names_or_rucs(package_data, tmp_path: Path) -> None:
    config, settings, data_dir = package_data
    out_dir = tmp_path / "publico"
    export(config, settings, data_dir, "publico", out_dir, SECRET)
    text = "\n".join(path.read_text(encoding="utf-8") for path in out_dir.rglob("*.json"))
    people_and_companies = [NAMES[COMPANY], NAMES[PERSON], NAMES[FOREIGNER]]
    for value in [*people_and_companies, "20000000001", "10000000002", *NAMES]:
        assert value.lower() not in text.lower(), value
    files = read_package(out_dir)
    for supplier in files["proveedores.json"]:
        assert supplier["nombre"] is None
        assert supplier["ruc"] is None
        assert supplier["url_ficha_unica"] is None
    described = all_processes(files)["ocds-p-0001"]["descripcion"]
    assert described == "OBRA CON [proveedor] RUC [RUC omitido]"


def test_same_supplier_keeps_the_same_pseudonym(package_data, tmp_path: Path) -> None:
    config, settings, data_dir = package_data
    out_dir = tmp_path / "publico"
    export(config, settings, data_dir, "publico", out_dir, SECRET)
    files = read_package(out_dir)
    processes = all_processes(files)
    (alias,) = processes["ocds-p-0001"]["ganadores"]
    assert processes["ocds-p-0002"]["ganadores"] == [alias]
    assert processes["ocds-n-0001"]["ganadores"] != [alias]
    assert files["indice.json"]["proveedores"][alias] == ["PE-CONSUCODE-1"]
    s03 = next(s for s in all_signals(files).values() if s["codigo"] == "S03")
    assert s03["objeto"] == {"tipo": "proveedor", "id": alias}
    assert s03["id"] == f"S03-{alias}-PE-CONSUCODE-1"
    assert s03["entradas"]["proveedor_id"] == alias
    export(config, settings, data_dir, "publico", tmp_path / "otra-vez", SECRET)
    again = all_processes(read_package(tmp_path / "otra-vez"))
    assert again["ocds-p-0001"]["ganadores"] == [alias]


def test_local_package_names_companies_but_never_natural_persons(
    package_data, tmp_path: Path
) -> None:
    config, settings, data_dir = package_data
    out_dir = tmp_path / "local"
    manifest = export(config, settings, data_dir, "local", out_dir, SECRET)
    assert manifest["modo"] == "local"
    files = read_package(out_dir)
    by_name = {s["nombre"]: s for s in files["proveedores.json"] if s["nombre"]}
    company = by_name[NAMES[COMPANY]]
    assert company["ruc"] == "20000000001"
    assert company["tipo"] == "persona_juridica"
    assert company["url_ficha_unica"].endswith("/20000000001")
    natural = [s for s in files["proveedores.json"] if s["tipo"] == "persona_natural"]
    assert natural and all(s["nombre"] is None and s["ruc"] is None for s in natural)
    unknown = [s for s in files["proveedores.json"] if s["tipo"] == "desconocido"]
    assert unknown and all(s["nombre"] is None for s in unknown)
    text = "\n".join(path.read_text(encoding="utf-8") for path in out_dir.rglob("*.json"))
    assert NAMES[PERSON].lower() not in text.lower()
    assert NAMES[FOREIGNER].lower() not in text.lower()
    assert "10000000002" not in text


# --- 5.3 · Package -------------------------------------------------------------------------


def test_priority_in_the_package(package_data, tmp_path: Path) -> None:
    config, settings, data_dir = package_data
    out_dir = tmp_path / "publico"
    export(config, settings, data_dir, "publico", out_dir, SECRET)
    files = read_package(out_dir)
    processes = all_processes(files)
    signals = all_signals(files)
    single = processes["ocds-p-0001"]
    assert [signals[s]["codigo"] for s in single["senales"]] == ["S01", "S03"]
    assert single["prioridad"]["puntaje"] == 6
    assert single["prioridad"]["nivel"] == "alta"
    for signal_id in single["senales"]:
        assert "ocds-p-0001" in signals[signal_id]["ocids"]
    quiet = [p for p in processes.values() if not p["senales"]]
    assert quiet and all(p["prioridad"] is None for p in quiet)


def test_package_is_consistent_with_its_manifest(package_data, tmp_path: Path) -> None:
    config, settings, data_dir = package_data
    out_dir = tmp_path / "publico"
    manifest = export(config, settings, data_dir, "publico", out_dir, SECRET)
    files = read_package(out_dir)
    assert manifest["conteos"] == {
        "procesos": len(all_processes(files)),
        "senales": len(all_signals(files)),
        "proveedores": len(files["proveedores.json"]),
        "entidades": len(files["entidades.json"]),
    }
    assert manifest["prioridad"] == {"pesos": settings.weights, "cortes": settings.cuts}
    assert set(manifest["senales_activas"]) >= {s["codigo"] for s in all_signals(files).values()}
    assert all(case_file["simulado"] for case_file in files["expedientes-simulados.json"])
    assert all(s["simulado"] for s in all_signals(files).values() if s["codigo"] == "S08")
    for process in all_processes(files).values():
        assert files["indice.json"]["procesos"][process["ocid"]] == process["entidad_id"]
        assert process["fechas"]["inicio_presentacion"] is None


def test_missing_ocid_stops_the_export_naming_file_and_field(package_data) -> None:
    config, settings, data_dir = package_data
    files = build_package(config, settings, data_dir, "publico", SECRET)
    validate_package(files)
    del files["procesos/PE-CONSUCODE-1.json"][0]["ocid"]
    with pytest.raises(ExportError, match=r"procesos/PE-CONSUCODE-1\.json en /0: 'ocid'"):
        validate_package(files)


def test_cli_export(package_data, tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys) -> None:
    _, _, data_dir = package_data
    monkeypatch.setenv("PSEUDONYM_SECRET", SECRET.decode())
    out_dir = tmp_path / "paquete"
    arguments = [
        "--config",
        str(tmp_path / "pipeline.toml"),
        "--signals-config",
        str(tmp_path / "senales.toml"),
        "--data-dir",
        str(data_dir),
    ]
    assert main(["export", *arguments, "--modo", "publico", "--out", str(out_dir)]) == 0
    assert "Paquete publico" in capsys.readouterr().out
    assert (out_dir / "manifest.json").exists()
    monkeypatch.delenv("PSEUDONYM_SECRET")
    monkeypatch.setattr("pipeline.export.ENV_FILE", tmp_path / "no-existe.env")
    assert main(["export", *arguments, "--modo", "publico", "--out", str(out_dir)]) == 1
    assert "PSEUDONYM_SECRET" in capsys.readouterr().err
