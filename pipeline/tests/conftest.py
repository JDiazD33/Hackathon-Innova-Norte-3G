"""Synthetic OCDS compiled releases for the spike tests. No real names or RUCs."""

from __future__ import annotations

import json
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import duckdb
import pytest

from pipeline import spike


def _buyer(party_id: str, department: str, province: str) -> dict[str, Any]:
    return {
        "id": party_id,
        "name": f"ENTIDAD DE PRUEBA {party_id}",
        "roles": ["buyer", "procuringEntity"],
        "address": {
            "department": department,
            "region": province,
            "locality": province,
            "countryName": "PERU",
        },
    }


def _item(status_details: str, cubso: str | None = None) -> dict[str, Any]:
    status = {"CONTRATADO": "complete", "DESIERTO": "unsuccessful"}[status_details]
    item: dict[str, Any] = {"id": "1", "status": status, "statusDetails": status_details}
    if cubso:
        item["classification"] = {"id": cubso, "scheme": "CUBSO"}
        item["additionalClassifications"] = [{"id": cubso[:8], "scheme": "UNSPSC"}]
    return item


def _tenderers(*ids: str) -> list[dict[str, str]]:
    return [{"id": tenderer_id} for tenderer_id in ids]


def _money(amount: float, currency: str = "PEN") -> dict[str, Any]:
    return {"amount": amount, "currency": currency}


SUPPLIER_A = "PE-RUC-20000000001"  # persona jurídica (RUC 20)
SUPPLIER_B = "PE-RUC-10000000002"  # persona natural (RUC 10)
SUPPLIER_C = "PE-RUC-20000000003"  # persona jurídica (RUC 20)
CONSORTIUM = "PE-RUC-1700001"  # consorcio: código corto que no es un RUC

RELEASES: list[dict[str, Any]] = [
    {  # 1 · La Libertad 2026, adjudicación simplificada, un postor, monto final mayor
        "ocid": "ocds-dgv273-prueba-0001",
        "id": "ocds-dgv273-prueba-0001-2026-03-20",
        "date": "2026-03-20T10:00:00-05:00",
        "tag": ["compiled"],
        "buyer": {"id": "PE-CONSUCODE-1"},
        "parties": [_buyer("PE-CONSUCODE-1", "LA LIBERTAD", "TRUJILLO")],
        "tender": {
            "id": "1",
            "datePublished": "2026-03-02T11:00:00-05:00",
            "procuringEntity": {"id": "PE-CONSUCODE-1"},
            "procurementMethod": "open",
            "procurementMethodDetails": "Adjudicación Simplificada",
            "mainProcurementCategory": "goods",
            "value": {"amount": 100000.0, "currency": "PEN", "amount_PEN": 100000.0},
            "tenderPeriod": {
                "startDate": "2026-03-02T00:00:00-05:00",
                "endDate": "2026-03-02T00:00:00-05:00",
            },
            "enquiryPeriod": {
                "startDate": "2026-03-03T00:01:00-05:00",
                "endDate": "2026-03-07T23:59:00-05:00",
            },
            "numberOfTenderers": 1,
            "tenderers": _tenderers(SUPPLIER_A),
            "items": [_item("CONTRATADO", "4211150200000001")],
            "documents": [
                {
                    "id": "d1",
                    "documentType": "biddingDocuments",
                    "title": "Bases",
                    "url": "https://example.org/documentos/d1",
                    "datePublished": "2026-03-02T11:00:00-05:00",
                },
                {
                    "id": "d2",
                    "documentType": "evaluationReports",
                    "title": "Acta de evaluación",
                    "url": "https://example.org/documentos/d2",
                    "datePublished": "2026-03-10T09:00:00-05:00",
                },
            ],
        },
        "awards": [
            {
                "id": "a1",
                "date": "2026-03-12T10:00:00-05:00",
                "value": _money(100000.0),
                "suppliers": _tenderers(SUPPLIER_A),
            }
        ],
        "contracts": [
            {
                "id": "c1",
                "awardID": "a1",
                "value": _money(100000.0),
                "implementation": {
                    "finalValue": _money(120000.0),
                    "endDate": "2026-06-20T10:00:00-05:00",
                },
            }
        ],
    },
    {  # 2 · La Libertad 2026, contratación directa con un postor (persona natural)
        "ocid": "ocds-dgv273-prueba-0002",
        "id": "ocds-dgv273-prueba-0002-2026-05-15",
        "date": "2026-05-15T10:00:00-05:00",
        "tag": ["compiled"],
        "buyer": {"id": "PE-CONSUCODE-1"},
        "parties": [_buyer("PE-CONSUCODE-1", "LA LIBERTAD", "TRUJILLO")],
        "tender": {
            "id": "2",
            "datePublished": "2026-05-10T09:00:00-05:00",
            "procuringEntity": {"id": "PE-CONSUCODE-1"},
            "procurementMethod": "direct",
            "procurementMethodDetails": "Contratación Directa",
            "mainProcurementCategory": "services",
            "value": {"amount": 50000.0, "currency": "PEN", "amount_PEN": 50000.0},
            "numberOfTenderers": 1,
            "tenderers": _tenderers(SUPPLIER_B),
            "items": [_item("CONTRATADO", "8010150100000001")],
        },
        "awards": [{"id": "a1", "value": _money(50000.0), "suppliers": _tenderers(SUPPLIER_B)}],
        "contracts": [
            {
                "id": "c1",
                "awardID": "a1",
                "status": "active",
                "statusDetails": "EJECUCION",
                "value": _money(50000.0),
            }
        ],
    },
    {  # 3 · La Libertad 2025, licitación pública desierta con tres postores
        "ocid": "ocds-dgv273-prueba-0003",
        "id": "ocds-dgv273-prueba-0003-2026-01-10",
        "date": "2026-01-10T10:00:00-05:00",
        "tag": ["compiled"],
        "buyer": {"id": "PE-CONSUCODE-2"},
        "parties": [_buyer("PE-CONSUCODE-2", "LA LIBERTAD", "SANCHEZ CARRION")],
        "tender": {
            "id": "3",
            "datePublished": "2025-11-20T15:00:00-05:00",
            "procuringEntity": {"id": "PE-CONSUCODE-2"},
            "procurementMethod": "open",
            "procurementMethodDetails": "Licitación Pública",
            "mainProcurementCategory": "works",
            "value": {"amount": 2000000.0, "currency": "PEN", "amount_PEN": 2000000.0},
            "tenderPeriod": {
                "startDate": "2025-11-20T00:00:00-05:00",
                "endDate": "2025-11-20T00:00:00-05:00",
            },
            "enquiryPeriod": {
                "startDate": "2025-11-21T00:01:00-05:00",
                "endDate": "2025-12-01T23:59:00-05:00",
            },
            "numberOfTenderers": 3,
            "tenderers": _tenderers(SUPPLIER_A, SUPPLIER_C, CONSORTIUM),
            "items": [_item("DESIERTO", "7210150100000001")],
        },
    },
    {  # 4 · La Libertad 2026, sin número de postores, adjudicación sin contrato y viceversa
        "ocid": "ocds-dgv273-prueba-0004",
        "id": "ocds-dgv273-prueba-0004-2026-08-01",
        "date": "2026-08-01T10:00:00-05:00",
        "tag": ["compiled"],
        "buyer": {"id": "PE-CONSUCODE-2"},
        "parties": [_buyer("PE-CONSUCODE-2", "LA LIBERTAD", "SANCHEZ CARRION")],
        "tender": {
            "id": "4",
            "datePublished": "2026-07-01T10:00:00-05:00",
            "procuringEntity": {"id": "PE-CONSUCODE-2"},
            "procurementMethodDetails": "Licitación Pública Abreviada",
            "mainProcurementCategory": "goods",
            "value": {"amount": 300000.0, "currency": "USD", "amount_PEN": 1000000.0},
            "tenderPeriod": {
                "startDate": "2026-07-01T00:00:00-05:00",
                "endDate": "2026-07-01T00:00:00-05:00",
            },
            "items": [_item("CONTRATADO")],
        },
        "awards": [
            {"id": "a1", "value": _money(150000.0, "USD"), "suppliers": _tenderers(SUPPLIER_C)},
            {"id": "a2", "value": _money(150000.0, "USD"), "suppliers": _tenderers(CONSORTIUM)},
        ],
        "contracts": [
            {"id": "c1", "awardID": "a1", "status": "active", "value": _money(150000.0, "USD")},
            {"id": "c2", "awardID": "a9", "value": _money(10.0, "USD")},
        ],
    },
    {  # 5 · Lambayeque 2026 (otro departamento)
        "ocid": "ocds-dgv273-prueba-0005",
        "id": "ocds-dgv273-prueba-0005-2026-04-20",
        "date": "2026-04-20T10:00:00-05:00",
        "tag": ["compiled"],
        "buyer": {"id": "PE-CONSUCODE-3"},
        "parties": [_buyer("PE-CONSUCODE-3", "LAMBAYEQUE", "CHICLAYO")],
        "tender": {
            "id": "5",
            "datePublished": "2026-04-01T10:00:00-05:00",
            "procuringEntity": {"id": "PE-CONSUCODE-3"},
            "procurementMethod": "open",
            "procurementMethodDetails": "Adjudicación Simplificada",
            "mainProcurementCategory": "goods",
            "value": {"amount": 80000.0, "currency": "PEN", "amount_PEN": 80000.0},
            "tenderPeriod": {
                "startDate": "2026-04-01T00:00:00-05:00",
                "endDate": "2026-04-01T00:00:00-05:00",
            },
            "numberOfTenderers": 2,
            "tenderers": _tenderers(SUPPLIER_A, SUPPLIER_C),
            "items": [_item("CONTRATADO", "4211150200000002")],
        },
        "awards": [{"id": "a1", "value": _money(80000.0), "suppliers": _tenderers(SUPPLIER_C)}],
        "contracts": [{"id": "c1", "awardID": "a1", "status": "active", "value": _money(80000.0)}],
    },
    {  # 6 · La Libertad 2024 (fuera de los años), plazo real y un postor repetido
        "ocid": "ocds-dgv273-prueba-0006",
        "id": "ocds-dgv273-prueba-0006-2026-02-01",
        "date": "2026-02-01T10:00:00-05:00",
        "tag": ["compiled"],
        "buyer": {"id": "PE-CONSUCODE-1"},
        "parties": [_buyer("PE-CONSUCODE-1", "LA LIBERTAD", "TRUJILLO")],
        "tender": {
            "id": "6",
            "datePublished": "2024-12-01T10:00:00-05:00",
            "procuringEntity": {"id": "PE-CONSUCODE-1"},
            "procurementMethod": "open",
            "procurementMethodDetails": "Adjudicación Simplificada",
            "mainProcurementCategory": "services",
            "value": {"amount": 60000.0, "currency": "PEN", "amount_PEN": 60000.0},
            "tenderPeriod": {
                "startDate": "2024-12-01T00:00:00-05:00",
                "endDate": "2024-12-03T00:00:00-05:00",
                "durationInDays": 2,
            },
            "numberOfTenderers": 4,
            "tenderers": _tenderers(SUPPLIER_A, SUPPLIER_C, CONSORTIUM, SUPPLIER_C),
            "items": [_item("CONTRATADO", "8010150100000002")],
        },
        "awards": [{"id": "a1", "value": _money(60000.0), "suppliers": _tenderers(SUPPLIER_A)}],
        "contracts": [
            {
                "id": "c1",
                "awardID": "a1",
                "status": "active",
                "value": _money(60000.0),
                "implementation": {"finalValue": _money(60000.0)},
            }
        ],
    },
    {  # 7 · Comprador sin entrada en parties: departamento indeterminado
        "ocid": "ocds-dgv273-prueba-0007",
        "id": "ocds-dgv273-prueba-0007-2026-03-01",
        "date": "2026-03-01T10:00:00-05:00",
        "tag": ["compiled"],
        "buyer": {"id": "PE-CONSUCODE-9"},
        "parties": [],
        "tender": {
            "id": "7",
            "datePublished": "2026-02-15T10:00:00-05:00",
            "procuringEntity": {"id": "PE-CONSUCODE-9"},
            "procurementMethod": "open",
            "procurementMethodDetails": "Subasta Inversa Electrónica",
            "mainProcurementCategory": "goods",
            "value": {"amount": 40000.0, "currency": "PEN", "amount_PEN": 40000.0},
            "numberOfTenderers": 5,
            "tenderers": _tenderers(
                "PE-RUC-20000000011",
                "PE-RUC-20000000012",
                "PE-RUC-20000000013",
                "PE-RUC-20000000014",
                "PE-RUC-20000000015",
            ),
            "items": [_item("DESIERTO")],
        },
    },
]

# Every process carries the buyer's name and the SEACE code ("nomenclatura") in tender.title.
for number, release in enumerate(RELEASES, start=1):
    release["buyer"]["name"] = f"ENTIDAD DE PRUEBA {release['buyer']['id']}"
    release["tender"]["title"] = f"PRUEBA-{number}-2026-EP-1"


def write_jsonl(path: Path, releases: list[dict[str, Any]]) -> Path:
    """Write ``releases`` as line-delimited JSON and return ``path``."""
    lines = (json.dumps(release, ensure_ascii=False) + "\n" for release in releases)
    path.write_text("".join(lines), encoding="utf-8")
    return path


@pytest.fixture
def releases_path(tmp_path: Path) -> Path:
    """The synthetic releases as a line-delimited JSON file."""
    return write_jsonl(tmp_path / "releases.jsonl", RELEASES)


@pytest.fixture
def split_releases_paths(tmp_path: Path) -> tuple[Path, Path]:
    """The synthetic releases split in two files, like the yearly files of the registry.

    ``a.jsonl`` has the three La Libertad processes of 2026; ``b.jsonl`` has the other four.
    """
    first = write_jsonl(tmp_path / "a.jsonl", [RELEASES[0], RELEASES[1], RELEASES[3]])
    second = write_jsonl(tmp_path / "b.jsonl", [RELEASES[2], RELEASES[4], RELEASES[5], RELEASES[6]])
    return first, second


@pytest.fixture
def loaded(releases_path: Path) -> Iterator[duckdb.DuckDBPyConnection]:
    """An in-memory DuckDB connection with the synthetic releases loaded."""
    con = spike.connect()
    spike.load_releases(con, releases_path)
    yield con
    con.close()
