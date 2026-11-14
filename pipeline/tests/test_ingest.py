"""Tests for the ingest and normalize steps (tasks 2.2 to 2.5)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import duckdb
import pytest
from factories import (
    CONFIG_TOML,
    award,
    contract,
    document,
    item,
    release,
    write_config,
    write_download_record,
    write_jsonl_gz,
)

from pipeline.cli import main
from pipeline.config import PipelineConfig, load_config
from pipeline.ingest import ingest, interim_path
from pipeline.normalize import TABLES, StaleIngestError, manifest_path, normalize, tables_dir

RUC_COMPANY = "PE-RUC-20000000001"
RUC_PERSON = "PE-RUC-10000000002"
CONSORTIUM = "PE-RUC-1700001"
RUC_15 = "PE-RUC-15000000004"


def read_table(data_dir: Path, name: str) -> list[dict[str, Any]]:
    path = tables_dir(data_dir) / f"{name}.parquet"
    con = duckdb.connect()
    relation = con.execute(f"SELECT * FROM read_parquet('{path.as_posix()}')")
    columns = [description[0] for description in relation.description]
    rows = [dict(zip(columns, row, strict=True)) for row in relation.fetchall()]
    con.close()
    return rows


def correction(manifest: dict[str, Any], kind: str) -> int:
    return next(item["cantidad"] for item in manifest["correcciones"] if item["tipo"] == kind)


def exclusion(summary: dict[str, Any], reason: str) -> int:
    return next(item["cantidad"] for item in summary["exclusiones"] if item["motivo"] == reason)


@pytest.fixture
def config(tmp_path: Path) -> PipelineConfig:
    return load_config(write_config(tmp_path))


@pytest.fixture
def scope_data(tmp_path: Path) -> Path:
    """Raw files that exercise the department and year filter."""
    data_dir = tmp_path / "data"
    write_jsonl_gz(
        data_dir / "raw" / "2025.jsonl.gz",
        [
            release(
                "ocds-prueba-0001",
                published="2025-12-01T10:00:00-05:00",
                updated="2025-12-15T10:00:00-05:00",
                description="VERSIÓN ANTIGUA",
            ),
            release(
                "ocds-prueba-0007",
                published="2025-06-01T10:00:00-05:00",
                updated="2025-07-01T10:00:00-05:00",
            ),
            release(
                "ocds-prueba-0008",
                department="LAMBAYEQUE",
                published="2025-06-01T10:00:00-05:00",
                updated="2025-07-01T10:00:00-05:00",
            ),
        ],
    )
    write_jsonl_gz(
        data_dir / "raw" / "2026.jsonl.gz",
        [
            release(
                "ocds-prueba-0001",
                published="2025-12-01T10:00:00-05:00",
                updated="2026-02-01T10:00:00-05:00",
                description="VERSIÓN NUEVA",
            ),
            release("ocds-prueba-0002", department="LAMBAYEQUE"),
            release("ocds-prueba-0003", entity="PE-CONSUCODE-9", with_buyer_party=False),
            release("ocds-prueba-0004", published="2024-05-01T10:00:00-05:00"),
            release("ocds-prueba-0005", published=None),
            release("ocds-prueba-0006", published="2025-11-20T10:00:00-05:00"),
        ],
    )
    return data_dir


@pytest.fixture
def quality_data(tmp_path: Path) -> Path:
    """Raw files, all inside the scope, with the quality issues of the source."""
    data_dir = tmp_path / "data"
    write_jsonl_gz(
        data_dir / "raw" / "2026.jsonl.gz",
        [
            release(
                "ocds-norm-0001",
                tenderers=[RUC_COMPANY, RUC_PERSON, RUC_COMPANY],
                items=[item("1"), item("2", status_details="DESIERTO", cubso=None)],
                awards=[award("a1", (RUC_COMPANY,)), award("a2", (RUC_PERSON,))],
                contracts=[
                    contract(
                        "c1",
                        "a1",
                        final_amount=1200.0,
                        documents=[document("d3", "contractSigned")],
                    ),
                    contract("c2", "a9", status=None),
                ],
                documents=[document("d1"), document("d2", document_type=None)],
            ),
            release(
                "ocds-norm-0002",
                tenderers=[CONSORTIUM],
                awards=[award("a1", ()), award("a2", (CONSORTIUM,))],
            ),
        ],
    )
    write_jsonl_gz(
        data_dir / "raw" / "2025.jsonl.gz",
        [
            release(
                "ocds-norm-0003",
                entity="PE-CONSUCODE-2",
                published="2025-08-01T10:00:00-05:00",
                updated="2025-09-01T10:00:00-05:00",
                tenderers=[RUC_15],
                awards=[award("a1", (RUC_15,))],
                contracts=[contract("c1", "a1")],
            )
        ],
    )
    write_download_record(data_dir / "raw", "2025.jsonl.gz", "2026-10-04T08:59:31-05:00")
    write_download_record(data_dir / "raw", "2026.jsonl.gz", "2026-10-04T08:58:49-05:00")
    return data_dir


def test_ingest_keeps_the_department_and_years(config: PipelineConfig, scope_data: Path) -> None:
    summary = ingest(config, scope_data)
    con = duckdb.connect()
    interim = interim_path(scope_data).as_posix()
    rows = con.execute(
        f"SELECT ocid, tender.description FROM read_parquet('{interim}') ORDER BY ocid"
    ).fetchall()
    con.close()
    assert [ocid for ocid, _ in rows] == [
        "ocds-prueba-0001",
        "ocds-prueba-0006",
        "ocds-prueba-0007",
    ]
    assert summary["leidos"] == {"2025.jsonl.gz": 3, "2026.jsonl.gz": 6}
    assert summary["procesos"] == 3


def test_other_region_is_left_out_and_unknown_region_is_counted(
    config: PipelineConfig, scope_data: Path
) -> None:
    summary = ingest(config, scope_data)
    assert exclusion(summary, "región indeterminada") == 1
    assert exclusion(summary, "año de convocatoria indeterminado") == 1


def test_repeated_process_keeps_the_latest_version(
    config: PipelineConfig, scope_data: Path
) -> None:
    summary = ingest(config, scope_data)
    assert summary["correcciones"] == [{"tipo": "proceso repetido entre archivos", "cantidad": 1}]
    con = duckdb.connect()
    (description,) = con.execute(
        f"SELECT tender.description FROM read_parquet('{interim_path(scope_data).as_posix()}') "
        "WHERE ocid = 'ocds-prueba-0001'"
    ).fetchone()
    con.close()
    assert description == "VERSIÓN NUEVA"


def test_missing_raw_file_is_reported(config: PipelineConfig, tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError, match="pipeline download"):
        ingest(config, tmp_path / "vacia")


def test_two_awards_give_two_rows_with_the_same_ocid(
    config: PipelineConfig, quality_data: Path
) -> None:
    ingest(config, quality_data)
    normalize(config, quality_data)
    awards = [
        row for row in read_table(quality_data, "adjudicaciones") if row["ocid"] == "ocds-norm-0001"
    ]
    assert [(row["adjudicacion_id"], row["proveedor_id"]) for row in awards] == [
        ("a1", RUC_COMPANY),
        ("a2", RUC_PERSON),
    ]
    assert [row["tiene_contrato"] for row in awards] == [True, False]


def test_quality_issues_are_treated_and_counted(config: PipelineConfig, quality_data: Path) -> None:
    ingest(config, quality_data)
    manifest = normalize(config, quality_data)

    tenderers = [
        row["proveedor_id"]
        for row in read_table(quality_data, "postores")
        if row["ocid"] == "ocds-norm-0001"
    ]
    assert tenderers == [RUC_PERSON, RUC_COMPANY]
    assert correction(manifest, "postor duplicado") == 1

    contracts = {
        row["contrato_id"]: row
        for row in read_table(quality_data, "contratos")
        if row["ocid"] == "ocds-norm-0001"
    }
    assert contracts["c2"]["estado"] == "sin estado"
    assert contracts["c2"]["adjudicacion_vinculada"] is False
    assert contracts["c1"]["monto_final"] == 1200.0
    assert correction(manifest, "contrato sin estado") == 1
    assert correction(manifest, "contrato sin adjudicación vinculada") == 1
    assert correction(manifest, "adjudicación sin contrato") == 3
    assert correction(manifest, "adjudicación sin proveedor") == 1
    assert correction(manifest, "documento sin tipo") == 1
    assert correction(manifest, "proceso repetido entre archivos") == 0


def test_suppliers_are_classified_by_ruc(config: PipelineConfig, quality_data: Path) -> None:
    ingest(config, quality_data)
    normalize(config, quality_data)
    suppliers = {row["proveedor_id"]: row for row in read_table(quality_data, "proveedores")}
    assert suppliers[RUC_COMPANY]["tipo"] == "persona_juridica"
    assert suppliers[RUC_COMPANY]["ruc"] == "20000000001"
    assert suppliers[RUC_PERSON]["tipo"] == "persona_natural"
    assert suppliers[RUC_15]["tipo"] == "persona_natural"
    assert suppliers[CONSORTIUM]["tipo"] == "desconocido"
    assert suppliers[CONSORTIUM]["ruc"] is None


def test_processes_items_and_documents(config: PipelineConfig, quality_data: Path) -> None:
    ingest(config, quality_data)
    normalize(config, quality_data)
    processes = {row["ocid"]: row for row in read_table(quality_data, "procesos")}
    assert processes["ocds-norm-0001"]["estado"] == "CONTRATADO, DESIERTO"
    assert processes["ocds-norm-0001"]["departamento"] == "LA LIBERTAD"
    assert str(processes["ocds-norm-0001"]["fecha_convocatoria"]) == "2026-03-02"
    assert processes["ocds-norm-0003"]["anio_convocatoria"] == 2025
    items = [row for row in read_table(quality_data, "items") if row["ocid"] == "ocds-norm-0001"]
    assert [(row["cubso"], row["unspsc"]) for row in items] == [
        ("4211150200000001", "42111502"),
        (None, None),
    ]
    documents = read_table(quality_data, "documentos")
    assert [(row["seccion"], row["documento_id"], row["tipo"]) for row in documents] == [
        ("tender", "d1", "biddingDocuments"),
        ("tender", "d2", "sin tipo"),
        ("contracts", "d3", "contractSigned"),
    ]
    entities = {row["entidad_id"]: row["procesos"] for row in read_table(quality_data, "entidades")}
    assert entities == {"PE-CONSUCODE-1": 2, "PE-CONSUCODE-2": 1}


def test_manifest_counts_match_the_tables(config: PipelineConfig, quality_data: Path) -> None:
    ingest(config, quality_data)
    manifest = normalize(config, quality_data)
    assert set(manifest["conteos"]) == set(TABLES)
    for table, count in manifest["conteos"].items():
        assert count == len(read_table(quality_data, table)), table
    saved = json.loads(manifest_path(quality_data).read_text(encoding="utf-8"))
    assert saved["conteos"] == manifest["conteos"]
    assert saved["region"] == "LA LIBERTAD"
    assert saved["anios"] == [2025, 2026]
    assert saved["version_reglas"] == "prueba.1"
    assert saved["fecha_corte"] == "2026-10-04"
    assert saved["fuente"]["licencia"] == "CC BY 4.0"
    assert [file["nombre"] for file in saved["fuente"]["archivos"]] == [
        "2025.jsonl.gz",
        "2026.jsonl.gz",
    ]


def test_normalize_needs_a_matching_ingest(
    config: PipelineConfig, quality_data: Path, tmp_path: Path
) -> None:
    with pytest.raises(FileNotFoundError, match="pipeline ingest"):
        normalize(config, quality_data)
    ingest(config, quality_data)
    other = load_config(write_config(tmp_path, CONFIG_TOML.replace("LA LIBERTAD", "PIURA")))
    with pytest.raises(StaleIngestError, match="otra región"):
        normalize(other, quality_data)


def test_cli_runs_the_steps(
    tmp_path: Path, quality_data: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    config_path = write_config(tmp_path)
    arguments = ["--config", str(config_path), "--data-dir", str(quality_data)]
    assert main(["normalize", *arguments]) == 1
    assert "pipeline ingest" in capsys.readouterr().err
    assert main(["ingest", *arguments]) == 0
    assert "Procesos de LA LIBERTAD (2025, 2026): 3" in capsys.readouterr().out
    assert main(["normalize", *arguments]) == 0
    assert "adjudicaciones: 5 filas" in capsys.readouterr().out


def test_cli_refuses_a_source_outside_the_list(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    text = CONFIG_TOML.replace(
        'url_plantilla = "https://data.example.org/descargas?name={archivo}"',
        'url_plantilla = "https://otro.example.org/datos?name={archivo}"',
    )
    config_path = write_config(tmp_path, text)
    data_dir = tmp_path / "data"
    assert main(["download", "--config", str(config_path), "--data-dir", str(data_dir)]) == 1
    error = capsys.readouterr().err
    assert "Fuente no permitida: https://otro.example.org/datos?name=2025.jsonl.gz" in error
    assert not (data_dir / "raw").exists()
