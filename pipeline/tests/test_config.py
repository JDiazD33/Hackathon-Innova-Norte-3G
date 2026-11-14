"""Tests for the pipeline configuration file."""

from __future__ import annotations

from pathlib import Path

import pytest
from factories import CONFIG_TOML, write_config

from pipeline.config import DEFAULT_CONFIG, ConfigError, load_config
from pipeline.download import is_allowed


def test_committed_config_is_valid() -> None:
    config = load_config(DEFAULT_CONFIG)
    assert config.scope.years
    for name in config.download.files:
        url = config.download.url_template.format(archivo=name)
        assert is_allowed(url, config.download.allowed_sources)


def test_test_config_loads(tmp_path: Path) -> None:
    config = load_config(write_config(tmp_path))
    assert config.scope.department == "LA LIBERTAD"
    assert config.scope.years == (2025, 2026)
    assert config.suppliers.legal_person_prefixes == ("20",)


def test_missing_parameter_is_named(tmp_path: Path) -> None:
    path = write_config(tmp_path, CONFIG_TOML.replace('departamento = "LA LIBERTAD"\n', ""))
    with pytest.raises(ConfigError, match=r"Falta el parámetro 'alcance\.departamento'"):
        load_config(path)


def test_missing_section_is_named(tmp_path: Path) -> None:
    text = CONFIG_TOML.split("[proveedores]")[0]
    with pytest.raises(ConfigError, match=r"proveedores\.prefijos_ruc_persona_natural"):
        load_config(write_config(tmp_path, text))


@pytest.mark.parametrize(
    ("old", "new", "message"),
    [
        ("anios = [2025, 2026]", 'anios = ["2025"]', "alcance.anios"),
        ("anios = [2025, 2026]", "anios = []", "alcance.anios"),
        ('departamento = "LA LIBERTAD"', 'departamento = ""', "alcance.departamento"),
        ("name={archivo}", "name=2026.jsonl.gz", "url_plantilla"),
        ('["20"]', '["2"]', "dos dígitos"),
    ],
)
def test_invalid_values_are_rejected(tmp_path: Path, old: str, new: str, message: str) -> None:
    with pytest.raises(ConfigError, match=message):
        load_config(write_config(tmp_path, CONFIG_TOML.replace(old, new)))


def test_missing_or_broken_file(tmp_path: Path) -> None:
    with pytest.raises(ConfigError, match="No existe"):
        load_config(tmp_path / "no-existe.toml")
    with pytest.raises(ConfigError, match="no es un TOML válido"):
        load_config(write_config(tmp_path, "esto no es = = toml"))
