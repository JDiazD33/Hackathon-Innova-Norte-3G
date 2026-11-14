"""Tests for the signal configuration and the S01 and S02 rules (tasks 3.1 to 3.3)."""

from __future__ import annotations

from pathlib import Path

import pytest
from factories import item, release, write_config
from signal_helpers import (
    DATE_2025,
    OTHER_REGION,
    S02_ACTIVE,
    SIGNALS_TOML,
    by_code,
    exclusion,
    prepare_data,
    read_results,
    run_signals,
    tenderers,
    write_signals_config,
)

from pipeline.cli import main
from pipeline.config import ConfigError, load_config
from pipeline.signals.compute import compute_signals
from pipeline.signals.settings import DEFAULT_SIGNALS_CONFIG, load_signals_config


def test_committed_signals_config_is_valid() -> None:
    settings = load_signals_config(DEFAULT_SIGNALS_CONFIG)
    assert settings.s01.switch.active
    assert not settings.s02.switch.active
    assert settings.s02.switch.reason
    assert settings.weights["S01"] == 3
    assert settings.cuts == {"alta": 5, "media": 3}
    assert settings.minimum_group == 30


def test_missing_parameter_stops_with_its_name(tmp_path: Path) -> None:
    path = write_signals_config(tmp_path, SIGNALS_TOML.replace("percentil = 10\n", ""))
    with pytest.raises(ConfigError, match=r"Falta el parámetro 'S02\.percentil'"):
        load_signals_config(path)


@pytest.mark.parametrize(
    ("old", "new", "message"),
    [
        ("activa = false\nmotivo = ", "activa = false\nnota = ", r"S02\.motivo"),
        (
            'plazo_inicio = "fecha_inicio_presentacion"',
            'plazo_inicio = "fecha_rara"',
            "plazo_inicio",
        ),
        ("[metodos.variantes]\n", '[metodos.variantes]\n"X" = "Inexistente"\n', "Inexistente"),
        (
            'competitivos = [\n  "Licitación Pública",',
            'competitivos = [\n  "Contratación Directa",\n  "Licitación Pública",',
            "competitivo y no competitivo",
        ),
        ("cortes = { alta = 5, media = 3 }", "cortes = { alta = 3, media = 3 }", "mayor que"),
        ("[prioridad.pesos]\n", "[prioridad.pesos]\nS99 = 1\n", "código desconocido"),
        ("percentil = 10", "percentil = 100", "entre 0 y 100"),
        ("minimo_grupo = 30", "minimo_grupo = 0", r"comun\.minimo_grupo"),
    ],
)
def test_invalid_signal_config_is_rejected(
    tmp_path: Path, old: str, new: str, message: str
) -> None:
    assert old in SIGNALS_TOML
    path = write_signals_config(tmp_path, SIGNALS_TOML.replace(old, new))
    with pytest.raises(ConfigError, match=message):
        load_signals_config(path)


def test_s01_flags_a_single_tenderer_in_a_competitive_method(tmp_path: Path) -> None:
    group = [release(f"ocds-grupo-{i:04d}", tenderers=tenderers(3)) for i in range(30)]
    _, rows = run_signals(
        tmp_path,
        [
            *group,
            release("ocds-caso-0001", tenderers=tenderers(1)),
            release(
                "ocds-directa-0001",
                method="Contratación Directa",
                method_ocds="direct",
                tenderers=tenderers(1),
            ),
            release("ocds-sindato-0001"),
            release("ocds-raro-0001", method="Método de Prueba", tenderers=tenderers(1)),
            release(
                "ocds-cancelado-0001",
                tenderers=tenderers(1),
                items=[item(status_details="CANCELADO")],
            ),
        ],
    )
    (signal,) = by_code(rows, "S01")
    assert signal["id"] == "S01-ocds-caso-0001"
    assert signal["objeto"] == {"tipo": "proceso", "id": "ocds-caso-0001"}
    assert signal["ocids"] == ["ocds-caso-0001"]
    assert signal["entidad_id"] == "PE-CONSUCODE-1"
    assert signal["valor"] == 1
    assert signal["unidad"] == "postores"
    assert signal["umbral"] == {
        "operador": "igual",
        "valor": 1.0,
        "descripcion": "procedimiento competitivo con un solo postor",
    }
    assert signal["referencia"] == {"cardinal": "R018", "ocp": "Single bid received"}
    assert signal["version_regla"] == "S01@1"
    assert signal["entradas"] == {"numero_postores": 1, "metodo": "Adjudicación Simplificada"}
    assert signal["calidad"] == []
    assert signal["simulado"] is False
    comparison = signal["comparacion"]
    assert comparison["ambito"] == "region"
    assert comparison["descripcion"] == "Adjudicación Simplificada de bienes en La Libertad, 2026"
    assert comparison["n"] == 31
    assert comparison["mediana"] == 3
    assert comparison["proporcion_referencia"] == round(30 / 31, 4)
    assert comparison["percentil_del_caso"] == round(100 / 31, 2)
    assert comparison["valla_superior"] is None


def test_s01_counts_what_it_cannot_evaluate(tmp_path: Path) -> None:
    manifest, rows = run_signals(
        tmp_path,
        [
            release("ocds-sindato-0001"),
            release("ocds-raro-0001", method="Método de Prueba", tenderers=tenderers(1)),
            release(
                "ocds-cancelado-0001",
                tenderers=tenderers(1),
                items=[item(status_details="CANCELADO")],
            ),
            release(
                "ocds-directa-0001",
                method="Contratación Directa",
                method_ocds="direct",
                tenderers=tenderers(1),
            ),
        ],
    )
    assert by_code(rows, "S01") == []
    assert exclusion(manifest, "S01", "sin dato de postores") == 1
    assert exclusion(manifest, "S01", "método sin clasificar") == 1
    assert exclusion(manifest, "S01", "proceso en estado excluido") == 1
    assert exclusion(manifest, "S01", "sin comprador") == 0
    assert manifest["metodos_sin_clasificar"] == ["Método de Prueba"]


def test_s01_uses_the_national_group_when_the_region_is_small(tmp_path: Path) -> None:
    regional = [
        release(f"ocds-ll25-{i:04d}", tenderers=tenderers(1 if i == 0 else 3), **DATE_2025)
        for i in range(3)
    ]
    national = [
        release(f"ocds-piura-{i:04d}", tenderers=tenderers(2), **OTHER_REGION, **DATE_2025)
        for i in range(40)
    ]
    _, rows = run_signals(tmp_path, releases_2025=regional + national)
    (signal,) = by_code(rows, "S01")
    assert signal["id"] == "S01-ocds-ll25-0000"
    comparison = signal["comparacion"]
    assert comparison["ambito"] == "nacional"
    assert comparison["descripcion"] == "Adjudicación Simplificada en todo el país, 2025"
    assert comparison["n"] == 43
    assert comparison["proporcion_referencia"] == round(42 / 43, 4)


def test_s02_flags_a_period_below_the_group_percentile(tmp_path: Path) -> None:
    group = [
        release(f"ocds-plazo-{i:04d}", tenderers=tenderers(2), submission_days=5, **DATE_2025)
        for i in range(30)
    ]
    short = release("ocds-corto-0001", tenderers=tenderers(2), submission_days=2, **DATE_2025)
    _, rows = run_signals(tmp_path, releases_2025=[*group, short], signals_text=S02_ACTIVE)
    (signal,) = by_code(rows, "S02")
    assert signal["id"] == "S02-ocds-corto-0001"
    assert signal["valor"] == 2
    assert signal["unidad"] == "días"
    assert signal["umbral"] == {
        "operador": "menor_que",
        "valor": 5.0,
        "descripcion": "por debajo del percentil 10 de su grupo",
    }
    assert signal["referencia"] == {"cardinal": "R003", "ocp": "Short submission period"}
    assert signal["version_regla"] == "S02@1"
    assert signal["entradas"] == {
        "dias": 2.0,
        "inicio": "2025-04-01",
        "fin": "2025-04-03",
        "metodo": "Adjudicación Simplificada",
    }
    assert signal["comparacion"]["ambito"] == "region"
    assert signal["comparacion"]["n"] == 31


def test_s02_small_regional_group_uses_the_national_group(tmp_path: Path) -> None:
    contest = {"method": "Concurso Público", "tenderers": tenderers(2)}
    regional = [
        release("ocds-ll-0001", submission_days=1, **contest),
        release("ocds-ll-0002", submission_days=20, **contest),
    ]
    national = [
        release(f"ocds-nac-{i:04d}", submission_days=10, **contest, **OTHER_REGION)
        for i in range(35)
    ]
    _, rows = run_signals(tmp_path, regional + national, signals_text=S02_ACTIVE)
    (signal,) = by_code(rows, "S02")
    assert signal["id"] == "S02-ocds-ll-0001"
    assert signal["comparacion"]["ambito"] == "nacional"
    assert signal["comparacion"]["n"] == 37
    assert signal["umbral"]["valor"] == 10.0


def test_s02_counts_processes_without_a_period(tmp_path: Path) -> None:
    direct = release(
        "ocds-directa-0001",
        method="Contratación Directa",
        method_ocds="direct",
        submission_days=None,
    )
    with_period = release("ocds-con-plazo-0001", tenderers=tenderers(2), submission_days=5)
    manifest, rows = run_signals(tmp_path, [direct, with_period], signals_text=S02_ACTIVE)
    assert "S02" in manifest["senales_activas"]
    assert exclusion(manifest, "S02", "sin dato de plazo") == 1
    assert by_code(rows, "S02") == []


def test_s02_s04_and_s06_are_deactivated_by_default(tmp_path: Path) -> None:
    manifest, rows = run_signals(tmp_path, [release("ocds-caso-0001", tenderers=tenderers(1))])
    defaults = load_signals_config()
    assert manifest["senales_activas"] == ["S01", "S03", "S05", "S08"]
    assert manifest["senales_desactivadas"] == [
        {"codigo": "S02", "motivo": defaults.s02.switch.reason},
        {"codigo": "S04", "motivo": defaults.s04.switch.reason},
        {
            "codigo": "S06",
            "motivo": "Solo el 0% de los contratos de La Libertad tiene monto final "
            "(contracts[].implementation.finalValue); el mínimo es 10%.",
        },
    ]
    assert manifest["versiones"] == {"S01": "S01@1", "S03": "S03@1", "S05": "S05@1", "S08": "S08@1"}
    assert manifest["conteos"]["S01"] == 1
    assert by_code(rows, "S02") == []
    assert by_code(rows, "S04") == []


def test_changing_a_parameter_changes_the_results_without_code(tmp_path: Path) -> None:
    durations = [
        release(f"ocds-dias-{days:02d}", tenderers=tenderers(2), submission_days=days, **DATE_2025)
        for days in range(1, 32)
    ]
    config, data_dir = prepare_data(tmp_path, [], durations)
    tenth = load_signals_config(write_signals_config(tmp_path, S02_ACTIVE))
    compute_signals(config, tenth, data_dir)
    first = by_code(read_results(data_dir), "S02")
    assert sorted(row["valor"] for row in first) == [1, 2, 3]
    assert {row["version_regla"] for row in first} == {"S02@1"}

    text = S02_ACTIVE.replace("percentil = 10", "percentil = 50").replace(
        "version = 1\n# El caso amerita", "version = 2\n# El caso amerita"
    )
    median = load_signals_config(write_signals_config(tmp_path, text))
    compute_signals(config, median, data_dir)
    second = by_code(read_results(data_dir), "S02")
    assert len(second) == 15
    assert {row["version_regla"] for row in second} == {"S02@2"}


def test_results_are_reproducible(tmp_path: Path) -> None:
    group = [release(f"ocds-grupo-{i:04d}", tenderers=tenderers(3)) for i in range(30)]
    releases = [*group, release("ocds-caso-0001", tenderers=tenderers(1))]
    config, data_dir = prepare_data(tmp_path, releases, [])
    settings = load_signals_config(write_signals_config(tmp_path))
    compute_signals(config, settings, data_dir)
    first = read_results(data_dir)
    compute_signals(config, settings, data_dir)
    assert read_results(data_dir) == first


def test_signals_need_the_normalized_tables(tmp_path: Path) -> None:
    config = load_config(write_config(tmp_path))
    with pytest.raises(FileNotFoundError, match="pipeline normalize"):
        compute_signals(config, load_signals_config(), tmp_path / "vacia")


def test_cli_signals(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    group = [release(f"ocds-grupo-{i:04d}", tenderers=tenderers(3)) for i in range(30)]
    _, data_dir = prepare_data(
        tmp_path, [*group, release("ocds-caso-0001", tenderers=tenderers(1))], []
    )
    arguments = [
        "--config",
        str(tmp_path / "pipeline.toml"),
        "--signals-config",
        str(write_signals_config(tmp_path)),
        "--data-dir",
        str(data_dir),
    ]
    assert main(["signals", *arguments]) == 0
    output = capsys.readouterr().out
    assert "S01 (S01@1): 1 señales" in output
    assert "S02 desactivada" in output
