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
class S03Settings:
    switch: SignalSwitch
    window_months: int
    minimum_awards: int


@dataclass(frozen=True)
class S04Threshold:
    method: str
    category: str  # OCDS mainProcurementCategory: goods, services or works
    year: int
    amount_pen: float
    norm: str
    verified: str


@dataclass(frozen=True)
class S04Settings:
    switch: SignalSwitch
    window_days: int
    classification_digits: int
    thresholds: tuple[S04Threshold, ...]


@dataclass(frozen=True)
class S05Settings:
    switch: SignalSwitch
    direct_methods: tuple[str, ...]  # base methods that count as direct contracting
    minimum_processes: int
    minimum_direct: int


@dataclass(frozen=True)
class S06Settings:
    switch: SignalSwitch
    factor: float
    minimum_coverage: float


@dataclass(frozen=True)
class S08Settings:
    switch: SignalSwitch
    count: int
    seed: int
    processes: tuple[str, ...]


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
    s03: S03Settings
    s04: S04Settings
    s05: S05Settings
    s06: S06Settings
    s08: S08Settings


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


CATEGORIES = {"bienes": "goods", "servicios": "services", "obras": "works"}


def _s04_thresholds(
    data: dict[str, Any], path: Path, competitive: tuple[str, ...]
) -> tuple[S04Threshold, ...]:
    entries = get_value(data, "S04.umbrales", path)
    if not isinstance(entries, list):
        raise ConfigError(f"'S04.umbrales' de {path} debe ser una lista de umbrales")
    thresholds = []
    for index, entry in enumerate(entries, start=1):
        key = f"umbrales[{index}]"  # S04.umbrales, without dots so the key can be nested
        if not isinstance(entry, dict):
            raise ConfigError(f"'S04.{key}' de {path} debe ser una tabla")
        wrapped = {key: entry}
        method = get_text(wrapped, f"{key}.metodo", path)
        if method not in competitive:
            raise ConfigError(
                f"'S04.{key}.metodo' de {path} debe ser un método competitivo: {method}"
            )
        category = get_text(wrapped, f"{key}.objeto", path)
        if category not in CATEGORIES:
            raise ConfigError(f"'S04.{key}.objeto' de {path} debe ser bienes, servicios u obras")
        amount = get_number(wrapped, f"{key}.umbral_pen", path)
        if amount <= 0:
            raise ConfigError(f"'S04.{key}.umbral_pen' de {path} debe ser mayor que cero")
        thresholds.append(
            S04Threshold(
                method=method,
                category=CATEGORIES[category],
                year=get_positive_int(wrapped, f"{key}.anio", path),
                amount_pen=amount,
                norm=get_text(wrapped, f"{key}.norma", path),
                verified=get_text(wrapped, f"{key}.verificado", path),
            )
        )
    return tuple(thresholds)


def _s04(
    data: dict[str, Any], path: Path, switch: SignalSwitch, methods: MethodTable
) -> S04Settings:
    digits = get_positive_int(data, "S04.digitos_clasificacion", path)
    if not 2 <= digits <= 8:
        raise ConfigError(f"'S04.digitos_clasificacion' de {path} debe estar entre 2 y 8")
    thresholds = _s04_thresholds(data, path, methods.competitive)
    if switch.active and not thresholds:
        raise ConfigError(f"S04 está activa pero 'S04.umbrales' de {path} no tiene umbrales")
    return S04Settings(
        switch=switch,
        window_days=get_positive_int(data, "S04.ventana_dias", path),
        classification_digits=digits,
        thresholds=thresholds,
    )


def _s05(
    data: dict[str, Any], path: Path, switch: SignalSwitch, methods: MethodTable
) -> S05Settings:
    direct = get_texts(data, "S05.metodos_directos", path)
    for method in direct:
        if method not in methods.non_competitive:
            raise ConfigError(
                f"'S05.metodos_directos' de {path} debe tener métodos de "
                f"metodos.no_competitivos: {method}"
            )
    return S05Settings(
        switch=switch,
        direct_methods=direct,
        minimum_processes=get_positive_int(data, "S05.minimo_procesos", path),
        minimum_direct=get_positive_int(data, "S05.minimo_directas", path),
    )


def _s06(data: dict[str, Any], path: Path, switch: SignalSwitch) -> S06Settings:
    factor = get_number(data, "S06.factor", path)
    if factor <= 1:
        raise ConfigError(f"'S06.factor' de {path} debe ser mayor que 1")
    coverage = get_number(data, "S06.cobertura_minima", path)
    if not 0 <= coverage <= 1:
        raise ConfigError(f"'S06.cobertura_minima' de {path} debe estar entre 0 y 1")
    return S06Settings(switch=switch, factor=factor, minimum_coverage=coverage)


def _s08(data: dict[str, Any], path: Path, switch: SignalSwitch) -> S08Settings:
    count = get_positive_int(data, "S08.cantidad_expedientes", path)
    if count > 50:
        raise ConfigError(f"'S08.cantidad_expedientes' de {path} debe ser 50 o menos")
    seed = get_value(data, "S08.semilla", path)
    if isinstance(seed, bool) or not isinstance(seed, int):
        raise ConfigError(f"'S08.semilla' de {path} debe ser un entero")
    return S08Settings(
        switch=switch,
        count=count,
        seed=seed,
        processes=get_text_list(data, "S08.procesos", path),
    )


def load_signals_config(path: Path = DEFAULT_SIGNALS_CONFIG) -> SignalsConfig:
    """Load and validate ``config/senales.toml``; a missing parameter stops with its name."""
    data = read_toml(path)
    switches = {code: _switch(data, code, path) for code in SIGNAL_CODES if code in data}
    for code in ("S01", "S02", "S03", "S04", "S05", "S06", "S08"):
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
    methods = _methods(data, path)

    return SignalsConfig(
        path=path,
        tukey_factor=tukey,
        minimum_group=get_positive_int(data, "comun.minimo_grupo", path),
        excluded_statuses=get_text_list(data, "comun.estados_excluidos", path),
        weights=_weights(data, path),
        cuts=cuts,
        methods=methods,
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
        s03=S03Settings(
            switch=switches["S03"],
            window_months=get_positive_int(data, "S03.ventana_meses", path),
            minimum_awards=get_positive_int(data, "S03.minimo_adjudicaciones", path),
        ),
        s04=_s04(data, path, switches["S04"], methods),
        s05=_s05(data, path, switches["S05"], methods),
        s06=_s06(data, path, switches["S06"]),
        s08=_s08(data, path, switches["S08"]),
    )
