"""S08 · Conformidad o pago sin sustento, o funciones incompatibles (SIMULATED data).

The open data has no internal records, so this step generates a few simulated case files
(expedientes) with a fixed seed, for chosen processes, in the format of
``expedientes-simulados.json`` of the data contract. S08 flags a case file where the same person
requests, evaluates and approves (conformidad), or where a payment has no documented approval.
Every case file and every S08 result carries ``simulado: true``. A process without a case file
is not evaluated. See docs/datos/catalogo-de-senales.md.
"""

from __future__ import annotations

import json
import random
from datetime import date, timedelta
from pathlib import Path
from typing import Any

import duckdb

from pipeline.ocds import sql_string
from pipeline.signals.context import RuleContext
from pipeline.signals.settings import SignalsConfig

CODE = "S08"
CASE_FILES = "expedientes-simulados.json"
PEOPLE = ("Persona A", "Persona B", "Persona C", "Persona D", "Persona E", "Persona F")
CASE_FILE_COLUMNS = (
    "{'ocid': 'VARCHAR', 'simulado': 'BOOLEAN', "
    "'etapas': 'STRUCT(etapa VARCHAR, responsable VARCHAR, fecha DATE, documento VARCHAR)[]'}"
)


def case_files_path(output_dir: Path) -> Path:
    return output_dir / CASE_FILES


def choose_processes(
    con: duckdb.DuckDBPyConnection, settings: SignalsConfig
) -> list[tuple[str, date | None, date | None]]:
    """The processes that get a case file, with their call and contract dates."""
    rows = con.execute(
        """
        SELECT c.ocid, c.fecha_convocatoria, min(k.fecha_firma) AS fecha_contrato
        FROM casos_region c
        LEFT JOIN contratos k USING (ocid)
        WHERE NOT c.excluido AND c.entidad_id IS NOT NULL
        GROUP BY ALL
        ORDER BY c.ocid
        """
    ).fetchall()
    dates = {ocid: (called, signed) for ocid, called, signed in rows}
    chosen = list(settings.s08.processes)
    if chosen:
        missing = [ocid for ocid in chosen if ocid not in dates]
        if missing:
            raise ValueError(
                "S08.procesos tiene procesos que no están en las tablas: " + ", ".join(missing)
            )
    else:
        with_contract = [ocid for ocid, (_, signed) in dates.items() if signed is not None]
        count = min(settings.s08.count, len(with_contract))
        chosen = sorted(random.Random(settings.s08.seed).sample(with_contract, count))
    return [(ocid, *dates[ocid]) for ocid in chosen]


def build_case_files(
    processes: list[tuple[str, date | None, date | None]], seed: int
) -> list[dict[str, Any]]:
    """Simulated case files, always the same for the same processes and seed.

    One in three repeats the same person in the request, the evaluation and the approval, one in
    three has a payment with no approval document, and the rest are clean.
    """
    rng = random.Random(seed)
    files = []
    for index, (ocid, called, signed) in enumerate(processes):
        base = called or signed or date(2026, 1, 1)
        requested = base - timedelta(days=rng.randint(10, 30))
        evaluated = base + timedelta(days=rng.randint(5, 15))
        approved = (signed or evaluated) + timedelta(days=rng.randint(15, 60))
        paid = approved + timedelta(days=rng.randint(2, 10))
        people = rng.sample(PEOPLE, 4)
        pattern = index % 3
        if pattern == 0:
            people[1] = people[2] = people[0]
        approval_document = (
            None if pattern == 1 else f"Informe de conformidad N.° {rng.randint(1, 999):03d}"
        )
        files.append(
            {
                "ocid": ocid,
                "simulado": True,
                "etapas": [
                    {
                        "etapa": "requerimiento",
                        "responsable": f"Área usuaria · {people[0]}",
                        "fecha": requested.isoformat(),
                        "documento": f"Requerimiento N.° {rng.randint(1, 999):03d}",
                    },
                    {
                        "etapa": "evaluacion",
                        "responsable": f"Comité de selección · {people[1]}",
                        "fecha": evaluated.isoformat(),
                        "documento": "Acta de evaluación",
                    },
                    {
                        "etapa": "conformidad",
                        "responsable": f"Área usuaria · {people[2]}",
                        "fecha": approved.isoformat(),
                        "documento": approval_document,
                    },
                    {
                        "etapa": "pago",
                        "responsable": f"Tesorería · {people[3]}",
                        "fecha": paid.isoformat(),
                        "documento": f"Comprobante de pago N.° {rng.randint(1, 999):03d}",
                    },
                ],
            }
        )
    return files


def compute(
    con: duckdb.DuckDBPyConnection, settings: SignalsConfig, context: RuleContext
) -> list[dict[str, Any]]:
    """Write the simulated case files, insert the S08 results and return the exclusions."""
    files = build_case_files(choose_processes(con, settings), settings.s08.seed)
    path = case_files_path(context.output_dir)
    path.write_text(json.dumps(files, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    con.execute(
        f"""
        CREATE OR REPLACE TEMP TABLE expedientes AS
        SELECT * FROM read_json({sql_string(str(path))}, format = 'array',
                                columns = {CASE_FILE_COLUMNS})
        """
    )
    con.execute(
        """
        INSERT INTO senales BY NAME
        WITH etapas AS (
            SELECT ocid,
                   (list_filter(etapas, lambda s: s.etapa = 'requerimiento')[1]) AS req,
                   (list_filter(etapas, lambda s: s.etapa = 'evaluacion')[1]) AS eva,
                   (list_filter(etapas, lambda s: s.etapa = 'conformidad')[1]) AS con,
                   (list_filter(etapas, lambda s: s.etapa = 'pago')[1]) AS pag
            FROM expedientes
        ),
        personas AS (
            SELECT ocid, con, pag,
                   nullif(split_part(req.responsable, ' · ', 2), '') AS persona_req,
                   nullif(split_part(eva.responsable, ' · ', 2), '') AS persona_eva,
                   nullif(split_part(con.responsable, ' · ', 2), '') AS persona_con
            FROM etapas
        ),
        reglas AS (
            SELECT ocid, persona_req,
                   coalesce(persona_req = persona_eva AND persona_eva = persona_con, false)
                       AS misma_persona,
                   pag IS NOT NULL AND (con IS NULL OR con.documento IS NULL)
                       AS pago_sin_conformidad
            FROM personas
        )
        SELECT 'S08-' || r.ocid AS id,
               'S08' AS codigo,
               'trazabilidad' AS categoria,
               'expediente' AS nivel,
               c.entidad_id,
               {'tipo': 'expediente', 'id': r.ocid} AS objeto,
               [r.ocid] AS ocids,
               CAST(CAST(r.misma_persona AS INTEGER) + CAST(r.pago_sin_conformidad AS INTEGER)
                    AS DOUBLE) AS valor,
               'condiciones' AS unidad,
               {'operador': 'mayor_o_igual', 'valor': 1.0,
                'descripcion': 'misma persona en requerimiento, evaluación y conformidad, '
                               || 'o pago sin conformidad documentada'} AS umbral,
               NULL AS comparacion,
               {'cardinal': NULL::VARCHAR, 'ocp': NULL::VARCHAR} AS referencia,
               $version AS version_regla,
               to_json({'misma_persona': r.misma_persona,
                        'persona': CASE WHEN r.misma_persona THEN r.persona_req END,
                        'pago_sin_conformidad_documentada': r.pago_sin_conformidad})
                   AS entradas,
               CAST([] AS VARCHAR[]) AS calidad,
               true AS simulado
        FROM reglas r
        JOIN casos_region c USING (ocid)
        WHERE r.misma_persona OR r.pago_sin_conformidad
        """,
        {"version": settings.s08.switch.rule_version},
    )
    (without_file,) = con.execute(
        "SELECT count(*) FROM casos_region WHERE ocid NOT IN (SELECT ocid FROM expedientes)"
    ).fetchone()
    return [{"codigo": CODE, "motivo": "sin expediente simulado", "cantidad": without_file}]
