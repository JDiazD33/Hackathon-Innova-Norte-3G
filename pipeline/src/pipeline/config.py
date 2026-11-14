"""Pipeline configuration (``config/pipeline.toml``): source, download, scope and data rules."""

from __future__ import annotations

import re
import tomllib
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

PROJECT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_CONFIG = PROJECT_DIR / "config" / "pipeline.toml"
DEFAULT_DATA_DIR = PROJECT_DIR.parent / "data"

# Peru has no daylight saving time, so Lima is always UTC-5.
LIMA = timezone(timedelta(hours=-5), "America/Lima")
DUCKDB_TIME_ZONE = "America/Lima"

_RUC_PREFIX = re.compile(r"\d{2}")


class ConfigError(ValueError):
    """A configuration file is missing a parameter or has an invalid value."""


@dataclass(frozen=True)
class SourceConfig:
    name: str
    url: str
    license: str
    attribution: str


@dataclass(frozen=True)
class DownloadConfig:
    allowed_sources: tuple[str, ...]
    url_template: str
    files: tuple[str, ...]


@dataclass(frozen=True)
class ScopeConfig:
    department: str
    years: tuple[int, ...]


@dataclass(frozen=True)
class SupplierConfig:
    natural_person_prefixes: tuple[str, ...]
    legal_person_prefixes: tuple[str, ...]


@dataclass(frozen=True)
class PipelineConfig:
    path: Path
    rules_version: str
    source: SourceConfig
    download: DownloadConfig
    scope: ScopeConfig
    suppliers: SupplierConfig


def read_toml(path: Path) -> dict[str, Any]:
    """Read a TOML configuration file, with a clear error if it is missing or malformed."""
    if not path.exists():
        raise ConfigError(f"No existe el archivo de configuración {path}")
    try:
        return tomllib.loads(path.read_text(encoding="utf-8"))
    except tomllib.TOMLDecodeError as error:
        raise ConfigError(f"{path} no es un TOML válido: {error}") from error


def get_value(data: dict[str, Any], key: str, path: Path) -> Any:
    """Return the value at the dotted ``key``, or fail naming the missing parameter."""
    node: Any = data
    for part in key.split("."):
        if not isinstance(node, dict) or part not in node:
            raise ConfigError(f"Falta el parámetro '{key}' en {path}")
        node = node[part]
    return node


def get_text(data: dict[str, Any], key: str, path: Path) -> str:
    value = get_value(data, key, path)
    if not isinstance(value, str) or not value.strip():
        raise ConfigError(f"El parámetro '{key}' de {path} debe ser un texto no vacío")
    return value


def get_texts(data: dict[str, Any], key: str, path: Path) -> tuple[str, ...]:
    value = get_value(data, key, path)
    if not isinstance(value, list) or not value:
        raise ConfigError(f"El parámetro '{key}' de {path} debe ser una lista no vacía")
    if not all(isinstance(item, str) and item.strip() for item in value):
        raise ConfigError(f"El parámetro '{key}' de {path} debe contener solo textos")
    return tuple(value)


def get_years(data: dict[str, Any], key: str, path: Path) -> tuple[int, ...]:
    value = get_value(data, key, path)
    valid = isinstance(value, list) and value
    if not valid or not all(isinstance(year, int) and not isinstance(year, bool) for year in value):
        raise ConfigError(f"El parámetro '{key}' de {path} debe ser una lista de años")
    return tuple(value)


def load_config(path: Path = DEFAULT_CONFIG) -> PipelineConfig:
    """Load and validate ``config/pipeline.toml``."""
    data = read_toml(path)
    url_template = get_text(data, "descarga.url_plantilla", path)
    if "{archivo}" not in url_template:
        raise ConfigError(f"'descarga.url_plantilla' de {path} debe contener {{archivo}}")
    natural = get_texts(data, "proveedores.prefijos_ruc_persona_natural", path)
    legal = get_texts(data, "proveedores.prefijos_ruc_persona_juridica", path)
    for prefix in (*natural, *legal):
        if not _RUC_PREFIX.fullmatch(prefix):
            raise ConfigError(f"Los prefijos de RUC de {path} deben tener dos dígitos: '{prefix}'")
    return PipelineConfig(
        path=path,
        rules_version=get_text(data, "version_reglas", path),
        source=SourceConfig(
            name=get_text(data, "fuente.nombre", path),
            url=get_text(data, "fuente.url", path),
            license=get_text(data, "fuente.licencia", path),
            attribution=get_text(data, "fuente.atribucion", path),
        ),
        download=DownloadConfig(
            allowed_sources=get_texts(data, "descarga.fuentes_permitidas", path),
            url_template=url_template,
            files=get_texts(data, "descarga.archivos", path),
        ),
        scope=ScopeConfig(
            department=get_text(data, "alcance.departamento", path),
            years=get_years(data, "alcance.anios", path),
        ),
        suppliers=SupplierConfig(natural_person_prefixes=natural, legal_person_prefixes=legal),
    )


def now_in_lima() -> str:
    """Current time in Lima as ISO 8601 with offset, for manifests."""
    return datetime.now(UTC).astimezone(LIMA).isoformat(timespec="seconds")
