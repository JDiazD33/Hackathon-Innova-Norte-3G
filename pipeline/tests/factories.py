"""Builders of synthetic OCDS compiled releases for the tests. No real names or RUCs."""

from __future__ import annotations

import gzip
import json
from pathlib import Path
from typing import Any

FROM_LIST = object()  # numberOfTenderers = number of listed tenderers

CONFIG_TOML = """\
version_reglas = "prueba.1"

[fuente]
nombre = "Fuente de prueba"
url = "https://example.org/fuente"
licencia = "CC BY 4.0"
atribucion = "Datos de prueba."

[descarga]
fuentes_permitidas = ["https://data.example.org/descargas", "https://cdn.example.org/archivos"]
url_plantilla = "https://data.example.org/descargas?name={archivo}"
archivos = ["2025.jsonl.gz", "2026.jsonl.gz"]

[alcance]
departamento = "LA LIBERTAD"
anios = [2025, 2026]

[proveedores]
prefijos_ruc_persona_natural = ["10", "15", "16", "17"]
prefijos_ruc_persona_juridica = ["20"]
"""


def write_config(directory: Path, text: str = CONFIG_TOML) -> Path:
    path = directory / "pipeline.toml"
    path.write_text(text, encoding="utf-8")
    return path


def write_jsonl_gz(path: Path, releases: list[dict[str, Any]]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = "".join(json.dumps(release, ensure_ascii=False) + "\n" for release in releases)
    path.write_bytes(gzip.compress(lines.encode("utf-8")))
    return path


def write_download_record(raw_dir: Path, name: str, last_modified: str) -> None:
    record = {
        "archivo": name,
        "url": f"https://data.example.org/descargas?name={name}",
        "descargado": "2026-11-13T17:00:00-05:00",
        "bytes": 1,
        "sha256": "0" * 64,
        "ultima_modificacion": last_modified,
    }
    (raw_dir / f"{name}.meta.json").write_text(json.dumps(record), encoding="utf-8")


def buyer_party(entity: str, department: str | None, province: str = "TRUJILLO") -> dict[str, Any]:
    address: dict[str, Any] = {"countryName": "PERU", "region": province, "locality": province}
    if department is not None:
        address["department"] = department
    return {
        "id": entity,
        "name": f"ENTIDAD DE PRUEBA {entity}",
        "roles": ["buyer", "procuringEntity"],
        "address": address,
        "additionalIdentifiers": [{"id": "20999999999", "scheme": "PE-RUC"}],
    }


def item(
    item_id: str = "1", status_details: str = "CONTRATADO", cubso: str | None = "4211150200000001"
) -> dict[str, Any]:
    status = {"CONTRATADO": "complete", "DESIERTO": "unsuccessful", "CONVOCADO": "active"}
    data: dict[str, Any] = {
        "id": item_id,
        "description": f"ÍTEM DE PRUEBA {item_id}",
        "quantity": 1.0,
        "status": status.get(status_details, "complete"),
        "statusDetails": status_details,
        "unit": {"name": "Unidad"},
        "totalValue": {"amount": 1000.0, "currency": "PEN"},
    }
    if cubso:
        data["classification"] = {"id": cubso, "scheme": "CUBSO"}
        data["additionalClassifications"] = [{"id": cubso[:8], "scheme": "UNSPSC"}]
    return data


def award(
    award_id: str,
    suppliers: tuple[str, ...] = ("PE-RUC-20000000001",),
    amount: float = 1000.0,
    date: str = "2026-03-12T10:00:00-05:00",
) -> dict[str, Any]:
    return {
        "id": award_id,
        "date": date,
        "value": {"amount": amount, "currency": "PEN"},
        "suppliers": [
            {"id": supplier, "name": f"PROVEEDOR {supplier[-4:]}"} for supplier in suppliers
        ],
    }


def contract(
    contract_id: str,
    award_id: str,
    status: str | None = "active",
    amount: float = 1000.0,
    final_amount: float | None = None,
    documents: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": contract_id,
        "awardID": award_id,
        "value": {"amount": amount, "currency": "PEN"},
        "dateSigned": "2026-03-20T10:00:00-05:00",
    }
    if status is not None:
        data["status"] = status
    if final_amount is not None:
        data["implementation"] = {
            "finalValue": {"amount": final_amount, "currency": "PEN"},
            "endDate": "2026-08-01T10:00:00-05:00",
        }
    if documents:
        data["documents"] = documents
    return data


def document(document_id: str, document_type: str | None = "biddingDocuments") -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": document_id,
        "title": f"Documento {document_id}",
        "url": f"https://example.org/documentos/{document_id}",
        "datePublished": "2026-03-02T11:00:00-05:00",
        "format": "pdf",
    }
    if document_type is not None:
        data["documentType"] = document_type
    return data


def release(
    ocid: str,
    *,
    entity: str = "PE-CONSUCODE-1",
    department: str | None = "LA LIBERTAD",
    with_buyer_party: bool = True,
    published: str | None = "2026-03-02T11:00:00-05:00",
    updated: str = "2026-03-20T10:00:00-05:00",
    method: str = "Adjudicación Simplificada",
    method_ocds: str | None = "open",
    category: str = "goods",
    amount: float = 100000.0,
    description: str | None = None,
    tenderers: list[str] | None = None,
    number_of_tenderers: Any = FROM_LIST,
    items: list[dict[str, Any]] | None = None,
    awards: list[dict[str, Any]] | None = None,
    contracts: list[dict[str, Any]] | None = None,
    documents: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    """A compiled release with sensible defaults; every argument can be overridden."""
    tender: dict[str, Any] = {
        "id": ocid.rsplit("-", 1)[-1],
        "title": f"PRUEBA-{ocid.rsplit('-', 1)[-1]}-2026-EP-1",
        "description": description or f"PROCESO DE PRUEBA {ocid}",
        "procuringEntity": {"id": entity},
        "procurementMethodDetails": method,
        "mainProcurementCategory": category,
        "value": {"amount": amount, "currency": "PEN", "amount_PEN": amount},
        "items": items if items is not None else [item()],
        "documents": documents or [],
    }
    if method_ocds is not None:
        tender["procurementMethod"] = method_ocds
    if published is not None:
        day = published[:10]
        tender["datePublished"] = published
        tender["tenderPeriod"] = {
            "startDate": f"{day}T00:00:00-05:00",
            "endDate": f"{day}T00:00:00-05:00",
        }
    if tenderers is not None:
        tender["tenderers"] = [{"id": t, "name": f"PROVEEDOR {t[-4:]}"} for t in tenderers]
    count = len(tenderers or []) if number_of_tenderers is FROM_LIST else number_of_tenderers
    if count is not None and (tenderers is not None or number_of_tenderers is not FROM_LIST):
        tender["numberOfTenderers"] = count
    data: dict[str, Any] = {
        "ocid": ocid,
        "id": f"{ocid}-{updated}",
        "date": updated,
        "tag": ["compiled"],
        "buyer": {"id": entity, "name": f"ENTIDAD DE PRUEBA {entity}"},
        "parties": [buyer_party(entity, department)] if with_buyer_party else [],
        "tender": tender,
    }
    if awards is not None:
        data["awards"] = awards
    if contracts is not None:
        data["contracts"] = contracts
    return data
