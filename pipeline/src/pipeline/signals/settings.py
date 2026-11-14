"""Signal configuration (``config/senales.toml``): parameters, versions, weights and methods."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from pipeline.config import PROJECT_DIR, ConfigError, get_text, get_texts, get_value, read_toml

DEFAULT_SIGNALS_CONFIG = PROJECT_DIR / "config" / "senales.toml"
SIGNAL_CODES = ("S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08")
# Columns of the ``procesos`` table that may hold the start and end of the S02 period.
PERIOD_COLUMNS = (
    "fecha_inicio_presentacion",
    "fecha_fin_presentacion",
    "fecha_inicio_consultas",
    "fecha_fin_consultas",
)


@dataclass(frozen=True)
class SignalSwitch:
    code: str
    active: bool
    version: int
    reason: str | None

    @property
    def rule_version(self) -> str:
        return f"{self.code}@{self.version}"


@dataclass(frozen=True)
class MethodTable:
    competitive: tuple[str, ...]
    non_competitive: tuple[str, ...]
    variants: dict[str, str]


@dataclass(frozen=True)
class S01Settings:
    switch: SignalSwitch
    unit: str
    threshold_description: str


@dataclass(frozen=True)
class S02Settings:
    switch: SignalSwitch
    percentile: float
    start_column: str
    end_column: str


@dataclass(frozen=True)
class SignalsConfig:
    path: Path
    tukey_factor: float
    minimum_group: int
    excluded_statuses: tuple[str, ...]
    weights: dict[str, int]
    cuts: dict[str, int]
    methods: MethodTable
    switches: dict[str, SignalSwitch]
    s01: S01Settings
    s02: S02Settings


def get_number(data: dict[str, Any], key: str, path: Path) -> float:
    value = get_value(data, key, path)
    if isinstance(value, bool) or not isinstance(value, int | float):
        raise ConfigError(f"El parámetro '{key}' de {path} debe ser un número")
    return float(value)


def get_positive_int(data: dict[str, Any], key: str, path: Path) -> int:
    value = get_value(data, key, path)
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise ConfigError(f"El parámetro '{key}' de {path} debe ser un entero mayor que cero")
    return value


def get_bool(data: dict[str, Any], key: str, path: Path) -> bool:
    value = get_value(data, key, path)
    if not isinstance(value, bool):
        raise ConfigError(f"El parámetro '{key}' de {path} debe ser true o false")
    return value


def get_text_list(data: dict[str, Any], key: str, path: Path) -> tuple[str, ...]:
    """A list of texts that may be empty."""
    value = get_value(data, key, path)
    if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
        raise ConfigError(f"El parámetro '{key}' de {path} debe ser una lista de textos")
    return tuple(value)


def _switch(data: dict[str, Any], code: str, path: Path) -> SignalSwitch:
    active = get_bool(data, f"{code}.activa", path)
    reason = None if active else get_text(data, f"{code}.motivo", path)
    return SignalSwitch(code, active, get_positive_int(data, f"{code}.version", path), reason)


def _weights(data: dict[str, Any], path: Path) -> dict[str, int]:
    weights = get_value(data, "prioridad.pesos", path)
    if not isinstance(weights, dict) or not weights:
        raise ConfigError(f"'prioridad.pesos' de {path} debe tener al menos un peso")
    for code in weights:
        if code not in SIGNAL_CODES:
            raise ConfigError(f"'prioridad.pesos' de {path} tiene un código desconocido: {code}")
    return {code: get_positive_int(data, f"prioridad.pesos.{code}", path) for code in weights}


def _methods(data: dict[str, Any], path: Path) -> MethodTable:
    competitive = get_texts(data, "metodos.competitivos", path)
    non_competitive = get_texts(data, "metodos.no_competitivos", path)
    repeated = set(competitive) & set(non_competitive)
    if repeated:
        raise ConfigError(
            f"Un método no puede ser competitivo y no competitivo a la vez en {path}: "
            + ", ".join(sorted(repeated))
        )
    variants = get_value(data, "metodos.variantes", path)
    if not isinstance(variants, dict):
        raise ConfigError(f"'metodos.variantes' de {path} debe asociar nombres a métodos base")
    known = set(competitive) | set(non_competitive)
    for name, base in variants.items():
        if base not in known:
            raise ConfigError(
                f"La variante '{name}' de {path} apunta a '{base}', que no está en "
                "metodos.competitivos ni en metodos.no_competitivos"
            )
    return MethodTable(competitive, non_competitive, dict(variants))


def load_signals_config(path: Path = DEFAULT_SIGNALS_CONFIG) -> SignalsConfig:
    """Load and validate ``config/senales.toml``; a missing parameter stops with its name."""
    data = read_toml(path)
    switches = {code: _switch(data, code, path) for code in SIGNAL_CODES if code in data}
    for code in ("S01", "S02"):
        if code not in switches:
            raise ConfigError(f"Falta la sección [{code}] en {path}")

    cuts = {
        "alta": get_positive_int(data, "prioridad.cortes.alta", path),
        "media": get_positive_int(data, "prioridad.cortes.media", path),
    }
    if cuts["alta"] <= cuts["media"]:
        raise ConfigError(f"En {path}, el corte 'alta' debe ser mayor que el corte 'media'")

    percentile = get_number(data, "S02.percentil", path)
    if not 0 < percentile < 100:
        raise ConfigError(f"'S02.percentil' de {path} debe estar entre 0 y 100")
    start_column = get_text(data, "S02.plazo_inicio", path)
    end_column = get_text(data, "S02.plazo_fin", path)
    for key, column in (("S02.plazo_inicio", start_column), ("S02.plazo_fin", end_column)):
        if column not in PERIOD_COLUMNS:
            raise ConfigError(
                f"'{key}' de {path} debe ser una de estas columnas: {', '.join(PERIOD_COLUMNS)}"
            )

    tukey = get_number(data, "comun.factor_tukey", path)
    if tukey <= 0:
        raise ConfigError(f"'comun.factor_tukey' de {path} debe ser mayor que cero")

    return SignalsConfig(
        path=path,
        tukey_factor=tukey,
        minimum_group=get_positive_int(data, "comun.minimo_grupo", path),
        excluded_statuses=get_text_list(data, "comun.estados_excluidos", path),
        weights=_weights(data, path),
        cuts=cuts,
        methods=_methods(data, path),
        switches=switches,
        s01=S01Settings(
            switch=switches["S01"],
            unit=get_text(data, "S01.unidad", path),
            threshold_description=get_text(data, "S01.descripcion_umbral", path),
        ),
        s02=S02Settings(
            switch=switches["S02"],
            percentile=percentile,
            start_column=start_column,
            end_column=end_column,
        ),
    )
