"""Export step (tasks 5.1 to 5.4): review priority, pseudonyms and the data package.

The package follows contract v1 (docs/arquitectura/contrato-paquete-de-datos.md) and every file
is validated against contracts/paquete-de-datos.schema.json before anything is written. Supplier
ids are always pseudonyms (HMAC-SHA256 with a local secret). In public mode no field carries
supplier names, RUCs or links that identify a supplier, and free texts hide them as well; natural
persons never show their name in any mode.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
from collections import defaultdict
from collections.abc import Iterable
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

import duckdb
from jsonschema import Draft202012Validator

from pipeline.config import PROJECT_DIR, PipelineConfig, now_in_lima
from pipeline.entities import entity_type
from pipeline.ocds import connect, sql_string
from pipeline.signals.compute import (
    check_tables,
    results_path,
    signals_dir,
    signals_manifest_path,
)
from pipeline.signals.s08 import case_files_path
from pipeline.signals.settings import SignalsConfig

CONTRACT_VERSION = "1.0"
SCHEMA_PATH = PROJECT_DIR.parent / "contracts" / "paquete-de-datos.schema.json"
WEB_DATA_DIR = PROJECT_DIR.parent / "web" / "data"
MODES = ("publico", "local")
ENV_FILE = PROJECT_DIR / ".env"
SECRET_VARIABLE = "PSEUDONYM_SECRET"
MINIMUM_SECRET_LENGTH = 16
FICHA_UNICA_URL = "https://apps.oece.gob.pe/perfilprov-ui/ficha/{ruc}"
# Anything with the shape of a RUC (persons start with 10, 15, 16 or 17; companies with 20).
RUC_PATTERN = re.compile(r"\b(?:1[05-7]|20)\d{9}\b")
RUC_PLACEHOLDER = "[RUC omitido]"
NAME_PLACEHOLDER = "[proveedor]"
MINIMUM_NAME_LENGTH = 5
# A name hidden in every text, and not only in the processes of that supplier, needs two words
# and eight characters, so that a single common word is not hidden everywhere.
GLOBAL_NAME_MINIMUM_WORDS = 2
GLOBAL_NAME_MINIMUM_LENGTH = 8
# Consortia get a new short code for each award (spike): they have no RUC, and foreign suppliers
# have an 11-digit code or "L" plus 10 digits instead.
CONSORTIUM_ID = re.compile(r"PE-RUC-\d{1,10}")
WORD_PATTERN = re.compile(r"\w+")
EDGE_PATTERN = re.compile(r"^\W+|\W+$")
# Accents and Ñ do not stop a match: the source writes the same name both ways.
FOLD = str.maketrans("ÁÉÍÓÚÜÀÈÌÒÙÂÊÎÔÛÄËÏÖÑ", "AEIOUUAEIOUAEIOUAEION")
OBJECTS = {"goods": "bienes", "services": "servicios", "works": "obras"}
PANEL_CATEGORIES = ("competencia", "tiempos", "concentracion", "fraccionamiento", "ejecucion")
TOP_SUPPLIERS = 5
SCHEMA_FOR_FILE = {
    "manifest.json": "manifest",
    "entidades.json": "entidades",
    "proveedores.json": "proveedores",
    "expedientes-simulados.json": "expedientes",
    "indice.json": "indice",
}


class ExportError(RuntimeError):
    """The package cannot be exported (missing secret or a file that breaks the contract)."""


# --- 5.1 · Priority ----------------------------------------------------------------------


def priority(
    codes: Iterable[str], weights: dict[str, int], cuts: dict[str, int]
) -> dict[str, Any] | None:
    """Score = sum of the weights of the process signals (one entry per cited signal).

    Signals without a weight (such as S05, shown only on the entity panel) do not add. A process
    without weighted signals has no priority and does not enter the review queue.
    """
    breakdown = [{"codigo": code, "peso": weights[code]} for code in codes if weights.get(code)]
    if not breakdown:
        return None
    score = sum(entry["peso"] for entry in breakdown)
    level = "alta" if score >= cuts["alta"] else "media" if score >= cuts["media"] else "baja"
    return {"puntaje": score, "nivel": level, "desglose": breakdown}


# --- 5.2 · Pseudonyms ---------------------------------------------------------------------


def load_secret(env_file: Path | None = None) -> bytes:
    """``PSEUDONYM_SECRET`` from the environment or from ``pipeline/.env`` (never committed)."""
    env_file = env_file or ENV_FILE
    value = os.environ.get(SECRET_VARIABLE, "")
    if not value and env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            key, _, rest = line.strip().partition("=")
            if key.strip() == SECRET_VARIABLE:
                value = rest.strip().strip('"').strip("'")
    if len(value) < MINIMUM_SECRET_LENGTH:
        raise ExportError(
            f"Falta {SECRET_VARIABLE} (al menos {MINIMUM_SECRET_LENGTH} caracteres) en el entorno "
            "o en pipeline/.env. Ver pipeline/.env.example."
        )
    return value.encode("utf-8")


def pseudonyms(keys: dict[str, str], secret: bytes) -> dict[str, str]:
    """Supplier id -> pseudonym (P0001...), numbered in the order of HMAC-SHA256(secret, key).

    ``key`` is the RUC, or the supplier id when there is none. The pseudonyms stay the same while
    the set of suppliers and the secret do not change, and nobody can revert them without the
    secret.
    """
    digests = sorted(
        (hmac.new(secret, key.encode("utf-8"), hashlib.sha256).hexdigest(), supplier)
        for supplier, key in keys.items()
    )
    width = max(4, len(str(len(digests))))
    return {supplier: f"P{index:0{width}d}" for index, (_, supplier) in enumerate(digests, 1)}


def _fold(text: str) -> str:
    """Upper case without accents, with the same length (positions still match the text)."""
    upper = text.upper()
    if len(upper) != len(text):
        upper = "".join(c.upper() if len(c.upper()) == 1 else c for c in text)
    return upper.translate(FOLD)


class NameIndex:
    """Supplier names indexed by their first word, so thousands of them are found quickly."""

    def __init__(
        self,
        names: Iterable[str | None],
        minimum_length: int = MINIMUM_NAME_LENGTH,
        minimum_words: int = 1,
    ) -> None:
        index: dict[str, set[str]] = defaultdict(set)
        for name in names:
            clean = EDGE_PATTERN.sub("", " ".join(_fold(name or "").split()))
            words = WORD_PATTERN.findall(clean)
            if len(clean) >= minimum_length and len(words) >= minimum_words:
                index[words[0]].add(clean)
        self._index = dict(index)

    def candidates(self, word: str) -> set[str]:
        return self._index.get(word, set())


def redact(text: str, *indexes: NameIndex) -> str:
    """Hide RUC-shaped numbers and the indexed names in a free text.

    Names match as whole words, longest first, ignoring case, accents and repeated spaces (runs
    of spaces are collapsed in the result).
    """
    text = RUC_PATTERN.sub(RUC_PLACEHOLDER, " ".join(text.split()))
    folded = _fold(text)
    pieces: list[str] = []
    position = 0
    for word in WORD_PATTERN.finditer(folded):
        start = word.start()
        if start < position:
            continue
        names = set().union(*(index.candidates(word.group()) for index in indexes))
        for name in sorted(names, key=len, reverse=True):
            end = start + len(name)
            if folded.startswith(name, start) and not WORD_PATTERN.match(folded, end):
                pieces += [text[position:start], NAME_PLACEHOLDER]
                position = end
                break
    pieces.append(text[position:])
    return "".join(pieces)


# --- Helpers ---------------------------------------------------------------------------------


def is_web_url(url: str | None) -> bool:
    if not url or any(character.isspace() for character in url):
        return False
    parts = urlsplit(url)
    return parts.scheme in ("http", "https") and bool(parts.netloc)


def _rows(con: duckdb.DuckDBPyConnection, sql: str) -> list[dict[str, Any]]:
    relation = con.execute(sql)
    columns = [description[0] for description in relation.description]
    return [dict(zip(columns, row, strict=True)) for row in relation.fetchall()]


def _date(value: Any) -> str | None:
    return value.isoformat() if value is not None else None


def _number(value: Any) -> float | None:
    """Amounts as numbers with two decimals; a negative amount is not valid data."""
    return None if value is None or value < 0 else round(float(value), 2)


def _first_text(*values: str | None) -> str | None:
    """The first value that is not empty or only spaces."""
    return next((value for value in values if value and value.strip()), None)


# --- 5.3 · Package -------------------------------------------------------------------------


def _load(con: duckdb.DuckDBPyConnection, tables: Path, data_dir: Path) -> dict[str, Any]:
    for name in (
        "procesos",
        "entidades",
        "adjudicaciones",
        "contratos",
        "documentos",
        "proveedores",
        "postores",
    ):
        path = sql_string(str(tables / f"{name}.parquet"))
        con.execute(f"CREATE TEMP VIEW {name} AS SELECT * FROM read_parquet({path})")
    signals_file = sql_string(str(results_path(data_dir)))
    return {
        "processes": _rows(
            con,
            """
            WITH adj AS (
                SELECT a.ocid,
                       sum(CASE WHEN a.moneda = p.moneda THEN a.monto END) AS monto_adjudicado,
                       min(a.fecha_adjudicacion) AS fecha_adjudicacion,
                       list_sort(list_distinct(list(a.proveedor_id)
                                               FILTER (WHERE a.proveedor_id IS NOT NULL)))
                           AS ganadores
                FROM adjudicaciones a JOIN procesos p USING (ocid)
                GROUP BY a.ocid
            ),
            con AS (
                SELECT ocid, min(fecha_firma) AS fecha_contrato,
                       max(fecha_culminacion) AS fecha_culminacion,
                       sum(monto_final) AS monto_final
                FROM contratos GROUP BY ocid
            )
            SELECT p.*, adj.monto_adjudicado, adj.fecha_adjudicacion, adj.ganadores,
                   con.fecha_contrato, con.fecha_culminacion, con.monto_final
            FROM procesos p LEFT JOIN adj USING (ocid) LEFT JOIN con USING (ocid)
            ORDER BY p.ocid
            """,
        ),
        "entities": _rows(con, "SELECT * FROM entidades ORDER BY entidad_id"),
        "documents": _rows(
            con,
            "SELECT ocid, tipo, titulo, url FROM documentos "
            "ORDER BY ocid, seccion DESC, contrato_id, documento_id",
        ),
        "suppliers": _rows(con, "SELECT * FROM proveedores ORDER BY proveedor_id"),
        "participants": _rows(
            con,
            """
            SELECT DISTINCT x.ocid, v.nombre, v.tipo
            FROM (SELECT ocid, proveedor_id FROM postores
                  UNION SELECT ocid, proveedor_id FROM adjudicaciones
                  WHERE proveedor_id IS NOT NULL) x
            JOIN proveedores v USING (proveedor_id)
            WHERE v.nombre IS NOT NULL
            ORDER BY x.ocid, v.nombre
            """,
        ),
        "shares": _rows(
            con,
            """
            WITH pen AS (
                SELECT p.entidad_id, a.proveedor_id, a.ocid, a.monto
                FROM adjudicaciones a JOIN procesos p USING (ocid)
                WHERE a.proveedor_id IS NOT NULL AND a.moneda = 'PEN'
            )
            SELECT entidad_id, proveedor_id, count(DISTINCT ocid) AS adjudicaciones,
                   sum(monto) / sum(sum(monto)) OVER (PARTITION BY entidad_id) AS participacion
            FROM pen GROUP BY entidad_id, proveedor_id
            """,
        ),
        "signals": _rows(con, f"SELECT * FROM read_parquet({signals_file}) ORDER BY codigo, id"),
    }


def build_package(
    config: PipelineConfig,
    settings: SignalsConfig,
    data_dir: Path,
    mode: str,
    secret: bytes,
) -> dict[str, Any]:
    """Every file of the package, as ``{relative path: data}``, not yet validated."""
    if mode not in MODES:
        raise ExportError(f"Modo desconocido: {mode}. Usa publico o local.")
    public = mode == "publico"
    tables, tables_manifest = check_tables(config, data_dir)
    if not results_path(data_dir).exists():
        raise FileNotFoundError(
            f"Falta {results_path(data_dir)}. Ejecuta antes `uv run pipeline signals`."
        )
    signals_manifest = json.loads(signals_manifest_path(data_dir).read_text(encoding="utf-8"))

    con = connect()
    try:
        data = _load(con, tables, data_dir)
    finally:
        con.close()

    suppliers = {row["proveedor_id"]: row for row in data["suppliers"]}
    winners = {winner for process in data["processes"] for winner in (process["ganadores"] or [])}
    flagged = {s["objeto"]["id"] for s in data["signals"] if s["codigo"] == "S03"}
    exported = sorted(winners | flagged)
    aliases = pseudonyms(
        {supplier: (suppliers.get(supplier, {}).get("ruc") or supplier) for supplier in exported},
        secret,
    )

    # Signals: supplier ids become pseudonyms; entidad_id only decides the file.
    signals_by_entity: dict[str, list[dict[str, Any]]] = defaultdict(list)
    cited: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for row in data["signals"]:
        signal = {key: value for key, value in row.items() if key != "entidad_id"}
        entradas = json.loads(row["entradas"]) if row["entradas"] else {}
        if row["codigo"] == "S03":
            alias = aliases[row["objeto"]["id"]]
            signal["id"] = f"S03-{alias}-{row['entidad_id']}"
            signal["objeto"] = {"tipo": "proveedor", "id": alias}
            entradas["proveedor_id"] = alias
        signal["entradas"] = entradas
        signals_by_entity[row["entidad_id"]].append(signal)
        if row["nivel"] != "entidad":
            for ocid in row["ocids"]:
                cited[ocid].append((row["codigo"], signal["id"]))

    documents: dict[str, list[dict[str, str]]] = defaultdict(list)
    for document in data["documents"]:
        if _first_text(document["titulo"]) and is_web_url(document["url"]):
            documents[document["ocid"]].append(document)

    # Free texts hide the names that the package does not show: every supplier in public mode,
    # every supplier but the companies in local mode. They are hidden in the texts of the
    # processes where the supplier took part and, except for consortia, in every other text too
    # (consortia often carry place names, such as "SAN MARTIN"). RUC-shaped numbers are hidden
    # in both modes.
    def hidden_in_texts(kind: str) -> bool:
        return public or kind != "persona_juridica"

    participants: dict[str, list[str]] = defaultdict(list)
    for row in data["participants"]:
        if hidden_in_texts(row["tipo"]):
            participants[row["ocid"]].append(row["nombre"])
    hidden_everywhere = NameIndex(
        (
            row["nombre"]
            for row in data["suppliers"]
            if hidden_in_texts(row["tipo"]) and not CONSORTIUM_ID.fullmatch(row["proveedor_id"])
        ),
        minimum_length=GLOBAL_NAME_MINIMUM_LENGTH,
        minimum_words=GLOBAL_NAME_MINIMUM_WORDS,
    )
    reference_pen: dict[str, float] = defaultdict(float)
    for row in data["processes"]:
        reference_pen[row["entidad_id"]] += max(row["monto_referencial_pen"] or 0, 0)

    processes_by_entity: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for process in data["processes"]:
        ocid = process["ocid"]
        hidden = (NameIndex(participants.get(ocid, [])), hidden_everywhere)
        text = (
            _first_text(process["descripcion"], process["nomenclatura"])
            or "Proceso sin descripción"
        )
        process_signals = sorted(cited.get(ocid, []))
        category = process["categoria"]
        processes_by_entity[process["entidad_id"]].append(
            {
                "ocid": ocid,
                "entidad_id": process["entidad_id"],
                "descripcion": redact(text, *hidden),
                "metodo": process["metodo"] or "Sin dato",
                "objeto": (
                    "consultoria_de_obras"
                    if category == "works" and "Consultor" in (process["metodo"] or "")
                    else OBJECTS.get(category, "otro")
                ),
                "moneda": process["moneda"] or "PEN",
                "monto_referencial": _number(process["monto_referencial"]),
                "monto_adjudicado": _number(process["monto_adjudicado"]),
                "monto_final": _number(process["monto_final"]),
                "fechas": {
                    "convocatoria": _date(process["fecha_convocatoria"]),
                    # The source has no submission period: tenderPeriod is the call date.
                    "inicio_presentacion": None,
                    "fin_presentacion": None,
                    "adjudicacion": _date(process["fecha_adjudicacion"]),
                    "contrato": _date(process["fecha_contrato"]),
                    "culminacion": _date(process["fecha_culminacion"]),
                },
                "numero_postores": process["numero_postores"],
                "estado": process["estado"],
                "ganadores": [aliases[winner] for winner in (process["ganadores"] or [])],
                "documentos": [
                    {
                        "tipo": document["tipo"],
                        "titulo": redact(document["titulo"], *hidden),
                        "url": document["url"],
                    }
                    for document in documents.get(ocid, [])
                ],
                "url_seace": None,
                "senales": [signal_id for _, signal_id in process_signals],
                "prioridad": priority(
                    [code for code, _ in process_signals], settings.weights, settings.cuts
                ),
                "simulado": False,
            }
        )

    shares_by_entity: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for share in data["shares"]:
        shares_by_entity[share["entidad_id"]].append(share)

    entities = []
    files: dict[str, Any] = {}
    supplier_entities: dict[str, set[str]] = defaultdict(set)
    for entity in data["entities"]:
        entity_id = entity["entidad_id"]
        processes = processes_by_entity.get(entity_id, [])
        signals = signals_by_entity.get(entity_id, [])
        signal_categories = {signal["id"]: signal["categoria"] for signal in signals}
        months: dict[str, list[int]] = defaultdict(lambda: [0, 0])
        per_category = dict.fromkeys(PANEL_CATEGORIES, 0)
        for process in processes:
            month = (process["fechas"]["convocatoria"] or "")[:7]
            if month:
                months[month][0] += 1
                months[month][1] += bool(process["senales"])
            for category in {signal_categories.get(s) for s in process["senales"]}:
                if category in per_category:
                    per_category[category] += 1
            for winner in process["ganadores"]:
                supplier_entities[winner].add(entity_id)
        top = sorted(
            shares_by_entity.get(entity_id, []),
            key=lambda share: (-(share["participacion"] or 0), aliases[share["proveedor_id"]]),
        )[:TOP_SUPPLIERS]
        entities.append(
            {
                "id": entity_id,
                "nombre": entity["nombre"] or entity_id,
                "tipo": entity_type(entity["nombre"] or ""),
                "resumen": {
                    "procesos": len(processes),
                    "monto_total": round(reference_pen.get(entity_id, 0.0), 2),
                    "procesos_con_senales": sum(bool(process["senales"]) for process in processes),
                    "por_categoria": per_category,
                    "tendencia_mensual": [
                        {"mes": month, "procesos": counts[0], "con_senales": counts[1]}
                        for month, counts in sorted(months.items())
                    ],
                    "top_proveedores": [
                        {
                            "proveedor_id": aliases[share["proveedor_id"]],
                            "participacion": round(share["participacion"] or 0, 4),
                            "adjudicaciones": share["adjudicaciones"],
                        }
                        for share in top
                    ],
                },
                "senales_entidad": [s["id"] for s in signals if s["nivel"] == "entidad"],
            }
        )
        files[f"procesos/{entity_id}.json"] = processes
        files[f"senales/{entity_id}.json"] = sorted(signals, key=lambda s: (s["codigo"], s["id"]))

    supplier_files = []
    for supplier in exported:
        row = suppliers.get(supplier, {})
        kind = row.get("tipo") or "desconocido"
        alias = aliases[supplier]
        named = not public and kind == "persona_juridica"
        ruc = row.get("ruc") if named else None
        supplier_files.append(
            {
                "id": alias,
                "alias": f"Proveedor {alias[1:]}",
                "nombre": row.get("nombre") if named else None,
                "ruc": ruc,
                "tipo": kind,
                "url_ficha_unica": FICHA_UNICA_URL.format(ruc=ruc) if ruc else None,
            }
        )
    supplier_files.sort(key=lambda supplier: supplier["id"])

    case_files = case_files_path(signals_dir(data_dir))
    all_signals = [signal for signals in signals_by_entity.values() for signal in signals]
    exclusions = list(tables_manifest["exclusiones"]) + [
        {"motivo": f"{item['codigo']}: {item['motivo']}", "cantidad": item["cantidad"]}
        for item in signals_manifest["exclusiones"]
        if item["cantidad"]
    ]
    files.update(
        {
            "entidades.json": entities,
            "proveedores.json": supplier_files,
            "expedientes-simulados.json": (
                json.loads(case_files.read_text(encoding="utf-8")) if case_files.exists() else []
            ),
            "indice.json": {
                "procesos": {
                    process["ocid"]: process["entidad_id"]
                    for processes in processes_by_entity.values()
                    for process in processes
                },
                "proveedores": {
                    alias: sorted(supplier_entities.get(alias, set()))
                    for alias in sorted(aliases.values())
                },
            },
            "manifest.json": {
                "version_contrato": CONTRACT_VERSION,
                "version_reglas": config.rules_version,
                "generado": now_in_lima(),
                "fecha_corte": tables_manifest.get("fecha_corte")
                or signals_manifest["fecha_corte"],
                "fuente": {
                    "nombre": config.source.name,
                    "url": config.source.url,
                    "archivos": list(config.download.files),
                },
                "licencia": config.source.license,
                "atribucion": config.source.attribution,
                "region": config.scope.department,
                "anios": list(config.scope.years),
                "modo": mode,
                "conteos": {
                    "procesos": sum(len(p) for p in processes_by_entity.values()),
                    "senales": len(all_signals),
                    "proveedores": len(supplier_files),
                    "entidades": len(entities),
                },
                "exclusiones": exclusions,
                "correcciones": list(tables_manifest["correcciones"]),
                "senales_activas": signals_manifest["senales_activas"],
                "senales_desactivadas": signals_manifest["senales_desactivadas"],
                "prioridad": {"pesos": dict(settings.weights), "cortes": dict(settings.cuts)},
            },
        }
    )
    return files


def schema_for(path: str) -> str:
    if path.startswith("procesos/"):
        return "procesos"
    if path.startswith("senales/"):
        return "senales"
    return SCHEMA_FOR_FILE[path]


def validate_package(files: dict[str, Any], schema_path: Path = SCHEMA_PATH) -> None:
    """Validate every file against its definition in the contract schema."""
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    validators: dict[str, Draft202012Validator] = {}
    problems = []
    for path, data in sorted(files.items()):
        name = schema_for(path)
        if name not in validators:
            wrapper = {
                "$schema": schema["$schema"],
                "$defs": schema["$defs"],
                "$ref": f"#/$defs/{name}",
            }
            validators[name] = Draft202012Validator(
                wrapper, format_checker=Draft202012Validator.FORMAT_CHECKER
            )
        for error in sorted(
            validators[name].iter_errors(data), key=lambda e: list(e.absolute_path)
        ):
            location = "/" + "/".join(str(part) for part in error.absolute_path)
            problems.append(f"{path} en {location}: {error.message}")
    if problems:
        shown = "\n".join(problems[:20])
        more = f"\n... y {len(problems) - 20} más" if len(problems) > 20 else ""
        raise ExportError(f"El paquete no cumple el contrato:\n{shown}{more}")


def write_package(files: dict[str, Any], out_dir: Path) -> None:
    """Replace the package in ``out_dir`` with ``files`` (only the package's own JSON files)."""
    for folder in ("procesos", "senales"):
        for old in (out_dir / folder).glob("*.json") if (out_dir / folder).exists() else []:
            old.unlink()
    for path, data in files.items():
        target = out_dir / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def export(
    config: PipelineConfig,
    settings: SignalsConfig,
    data_dir: Path,
    mode: str,
    out_dir: Path | None = None,
    secret: bytes | None = None,
) -> dict[str, Any]:
    """Build, validate and write the package; return its manifest."""
    files = build_package(config, settings, data_dir, mode, secret or load_secret())
    validate_package(files)
    write_package(files, out_dir or WEB_DATA_DIR / mode)
    return files["manifest.json"]
