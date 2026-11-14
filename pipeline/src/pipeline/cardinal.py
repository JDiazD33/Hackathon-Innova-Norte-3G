"""Contrast with Cardinal (task 4.4): run R018 and R003 and compare them with S01 and S02.

Cardinal (Open Contracting Partnership, MIT) runs as an external command-line tool; its code is not
copied or changed. The input has only the fields these two indicators read, with
``tender.procurementMethod`` filled from our method table: the source leaves it empty for the
methods of Ley 32069, so R018 would not see them. The report lists the coincidences and the
differences with their reason, or says why a contrast was not possible.
"""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path
from typing import Any

import duckdb

from pipeline.config import PROJECT_DIR, PipelineConfig, now_in_lima
from pipeline.ocds import connect, sql_string
from pipeline.signals.compute import check_tables, open_tables, results_path, signals_dir
from pipeline.signals.settings import SignalsConfig

REPORT_FILE = "contraste-cardinal.json"
INPUT_FILE = "cardinal-entrada.jsonl"
SETTINGS_FILE = "cardinal-settings.ini"
# Sections enable the indicators; their parameters keep Cardinal's defaults (R003: 15 days;
# R018: open and selective methods).
SETTINGS_TEXT = "[R003]\n\n[R018]\n"
TIMEOUT_SECONDS = 600
NOT_INSTALLED = (
    "No está instalada la herramienta de línea de comandos de Cardinal "
    "(ver CONTRIBUTING.md): el contraste no se hizo y el resto del pipeline no cambia."
)

_INPUT_SQL = """
COPY (
    SELECT ocid,
           {'procurementMethod': CASE WHEN competitivo THEN 'open'
                                      WHEN NOT competitivo THEN 'direct' END,
            'procurementMethodDetails': metodo,
            'numberOfTenderers': numero_postores,
            'tenderPeriod': CASE WHEN fecha_inicio_presentacion IS NOT NULL
                                  AND fecha_fin_presentacion IS NOT NULL
                                 THEN {'startDate': strftime(fecha_inicio_presentacion,
                                                             '%Y-%m-%dT00:00:00-05:00'),
                                       'endDate': strftime(fecha_fin_presentacion,
                                                           '%Y-%m-%dT00:00:00-05:00')}
                            END} AS tender
    FROM casos_region
    ORDER BY ocid
) TO __PATH__ (FORMAT json)
"""


def find_cardinal(explicit: Path | None = None) -> Path | None:
    """The Cardinal executable: the given path, one on the PATH, or the one in ``.tools/``."""
    if explicit is not None:
        return explicit if explicit.exists() else None
    found = shutil.which("ocdscardinal")
    if found:
        return Path(found)
    for name in ("ocdscardinal.exe", "ocdscardinal"):
        candidate = PROJECT_DIR / ".tools" / "cargo" / "bin" / name
        if candidate.exists():
            return candidate
    return None


def compare(
    signal: set[str],
    cardinal: set[str],
    reasons: dict[str, str],
    default_reason: str = "revisar a mano",
) -> dict[str, Any]:
    """Coincidences and differences between our signal and a Cardinal indicator."""
    both = signal & cardinal
    return {
        "senal": len(signal),
        "cardinal": len(cardinal),
        "coincidencias": len(both),
        "porcentaje_coincidencia": round(100 * len(both) / len(signal), 1) if signal else None,
        "solo_senal": [
            {"ocid": ocid, "motivo": reasons.get(ocid, default_reason)}
            for ocid in sorted(signal - cardinal)
        ],
        "solo_cardinal": [
            {"ocid": ocid, "motivo": reasons.get(ocid, default_reason)}
            for ocid in sorted(cardinal - signal)
        ],
    }


def run_indicators(binary: Path, input_path: Path, settings_path: Path) -> dict[str, set[str]]:
    """Run ``ocdscardinal indicators`` and return the flagged ocids by indicator."""
    result = subprocess.run(
        [str(binary), "indicators", "--settings", str(settings_path), "--no-meta", str(input_path)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        timeout=TIMEOUT_SECONDS,
        check=True,
    )
    output = json.loads(result.stdout or "{}")
    flagged: dict[str, set[str]] = {}
    for ocid, results in output.get("OCID", {}).items():
        for code in results:
            flagged.setdefault(code, set()).add(ocid)
    return flagged


def cardinal_version(binary: Path) -> str | None:
    try:
        result = subprocess.run(
            [str(binary), "--version"], capture_output=True, text=True, timeout=60, check=True
        )
    except (OSError, subprocess.SubprocessError):
        return None
    return result.stdout.strip() or None


def _difference_reasons(con: duckdb.DuckDBPyConnection) -> dict[str, str]:
    """Why S01 may leave out a process that R018 flags (only for the processes it skips)."""
    rows = con.execute(
        """
        SELECT ocid,
               CASE WHEN excluido THEN 'S01 no evalúa procesos en estado ' || estado
                    WHEN entidad_id IS NULL THEN 'S01 no evalúa procesos sin comprador'
                    WHEN competitivo IS NULL THEN 'S01 no evalúa métodos sin clasificar'
               END AS motivo
        FROM casos_region
        WHERE excluido OR entidad_id IS NULL OR competitivo IS NULL
        """
    ).fetchall()
    return {ocid: reason for ocid, reason in rows if reason}


def _signal_ocids(con: duckdb.DuckDBPyConnection, data_dir: Path, code: str) -> set[str]:
    rows = con.execute(
        f"SELECT objeto.id FROM read_parquet({sql_string(str(results_path(data_dir)))}) "
        "WHERE codigo = $code",
        {"code": code},
    ).fetchall()
    return {row[0] for row in rows}


def contrast(
    config: PipelineConfig,
    settings: SignalsConfig,
    data_dir: Path,
    binary: Path | None = None,
) -> dict[str, Any]:
    """Run the contrast and write ``data/derived/senales/contraste-cardinal.json``."""
    tables, _ = check_tables(config, data_dir)
    if not results_path(data_dir).exists():
        raise FileNotFoundError(
            f"Falta {results_path(data_dir)}. Ejecuta antes `uv run pipeline signals`."
        )
    report: dict[str, Any] = {"generado": now_in_lima(), "herramienta": None}
    input_path = data_dir / "interim" / INPUT_FILE
    settings_path = data_dir / "interim" / SETTINGS_FILE

    con = connect()
    try:
        open_tables(con, tables, settings)
        con.execute(_INPUT_SQL.replace("__PATH__", sql_string(str(input_path))))
        (processes, with_period) = con.execute(
            "SELECT count(*), count(*) FILTER (WHERE fecha_inicio_presentacion IS NOT NULL "
            "AND fecha_fin_presentacion IS NOT NULL) FROM casos_region"
        ).fetchone()
        s01_ocids = _signal_ocids(con, data_dir, "S01")
        s02_ocids = _signal_ocids(con, data_dir, "S02")
        reasons = _difference_reasons(con)
    finally:
        con.close()
    report["entrada"] = {"archivo": str(input_path.name), "procesos": processes}

    if binary is None:
        report["contraste"] = "no fue posible"
        report["motivo"] = NOT_INSTALLED
    else:
        settings_path.write_text(SETTINGS_TEXT, encoding="utf-8")
        flagged = run_indicators(binary, input_path, settings_path)
        report["herramienta"] = cardinal_version(binary)
        report["R018"] = {
            "senal": "S01",
            **compare(s01_ocids, flagged.get("R018", set()), reasons),
        }
        r003 = flagged.get("R003", set())
        if settings.s02.switch.active:
            report["R003"] = {"senal": "S02", **compare(s02_ocids, r003, {})}
        else:
            report["R003"] = {
                "senal": "S02",
                "contraste": "no fue posible",
                "motivo": f"S02 está desactivada: {settings.s02.switch.reason}",
                "cardinal": len(r003),
                "procesos_con_tenderPeriod": with_period,
            }

    path = signals_dir(data_dir) / REPORT_FILE
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report
