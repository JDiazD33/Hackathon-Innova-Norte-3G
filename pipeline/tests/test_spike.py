"""Tests for the data spike queries, the regional sample and the Cardinal coverage wrapper."""

from __future__ import annotations

import gzip
import json
from pathlib import Path
from typing import Any

import duckdb
import pytest

from pipeline import spike
from pipeline.cli import _file_stem, main

DEPARTMENT = "LA LIBERTAD"
YEARS = [2025, 2026]


def rows(con: duckdb.DuckDBPyConnection, name: str) -> list[dict[str, Any]]:
    """Run the spike query called ``name`` and return its rows as dictionaries."""
    query = next(query for query in spike.QUERIES if query.name == name)
    result = spike.run_query(con, query, DEPARTMENT, YEARS)
    return [dict(zip(result["columnas"], row, strict=True)) for row in result["filas"]]


def test_load_counts_every_release(releases_path: Path) -> None:
    con = spike.connect()
    assert spike.load_releases(con, releases_path) == 7
    con.close()


def test_query_names_are_unique() -> None:
    names = [query.name for query in spike.QUERIES]
    assert len(names) == len(set(names))


def test_every_query_runs(loaded: duckdb.DuckDBPyConnection) -> None:
    results = spike.run_queries(loaded, DEPARTMENT, YEARS)
    assert [result["nombre"] for result in results] == [query.name for query in spike.QUERIES]


def test_department_comes_from_the_buyer_party(loaded: duckdb.DuckDBPyConnection) -> None:
    counts = {
        row["departamento"]: row["procesos"] for row in rows(loaded, "procesos_por_departamento")
    }
    assert counts == {"LA LIBERTAD": 5, "LAMBAYEQUE": 1, None: 1}


def test_buyer_without_party_has_no_department(loaded: duckdb.DuckDBPyConnection) -> None:
    (row,) = rows(loaded, "cobertura_del_departamento")
    assert row["procesos"] == 7
    assert row["con_party_del_comprador"] == 6
    assert row["con_department"] == 6


def test_tender_period_collapsed_to_the_call_date(loaded: duckdb.DuckDBPyConnection) -> None:
    (row,) = rows(loaded, "cobertura_de_tenderPeriod")
    assert row["con_startDate"] == 5
    assert row["inicio_igual_a_fin"] == 4
    assert row["inicio_el_dia_de_la_convocatoria"] == 5
    assert row["con_enquiryPeriod"] == 2


def test_enquiry_period_days_by_method(loaded: duckdb.DuckDBPyConnection) -> None:
    by_method = {row["metodo"]: row for row in rows(loaded, "plazos_por_metodo_en_los_anios")}
    assert by_method["Adjudicación Simplificada"]["dias_de_consultas_p10_p50_p90"] == [5, 5, 5]
    assert by_method["Licitación Pública"]["dias_de_consultas_p10_p50_p90"] == [11, 11, 11]
    assert by_method["Contratación Directa"]["dias_de_consultas_p10_p50_p90"] is None


def test_days_until_the_first_evaluation_report(loaded: duckdb.DuckDBPyConnection) -> None:
    by_method = {
        row["metodo"]: row for row in rows(loaded, "dias_hasta_la_primera_acta_de_evaluacion")
    }
    simplified = by_method["Adjudicación Simplificada"]
    assert simplified["con_acta"] == 1
    assert simplified["dias_p10_p50_p90"] == [8, 8, 8]
    assert simplified["acta_antes_de_la_convocatoria"] == 0


def test_cases_to_check_in_seace(loaded: duckdb.DuckDBPyConnection) -> None:
    cases = {row["caso"]: row for row in rows(loaded, "casos_para_verificar_en_el_seace")}
    assert cases["adjudicado con un solo postor"]["ocid"] == "ocds-dgv273-prueba-0001"
    assert cases["adjudicado con un solo postor"]["nomenclatura"] == "PRUEBA-1-2026-EP-1"
    assert cases["desierto con varios postores"]["ocid"] == "ocds-dgv273-prueba-0003"
    assert cases["desierto con varios postores"]["postores"] == 3


def test_amounts_and_award_dates(loaded: duckdb.DuckDBPyConnection) -> None:
    (amounts,) = rows(loaded, "montos_en_el_departamento")
    assert amounts == {
        "procesos": 4,
        "con_valor_referencial": 4,
        "en_otra_moneda": 1,
        "con_amount_PEN": 4,
    }
    (awards,) = rows(loaded, "fechas_de_adjudicacion")
    assert awards == {"adjudicaciones": 5, "con_fecha": 1}


def test_number_of_tenderers_coverage(loaded: duckdb.DuckDBPyConnection) -> None:
    (row,) = rows(loaded, "cobertura_de_postores")
    assert row["con_numberOfTenderers"] == 6
    assert row["con_uno"] == 2
    assert row["con_cero"] == 0
    assert row["con_postor_duplicado"] == 1


def test_bids_are_reported_missing(loaded: duckdb.DuckDBPyConnection) -> None:
    fields = {row["campo"] for row in rows(loaded, "campos_de_primer_nivel")}
    assert {"tender", "awards", "contracts"} <= fields
    assert "bids" not in fields
    assert "archivo" not in fields


def test_load_several_files_keeps_the_file_name(split_releases_paths: tuple[Path, Path]) -> None:
    con = spike.connect()
    assert spike.load_releases(con, *split_releases_paths) == 7
    by_file = {row["archivo"]: row["procesos"] for row in rows(con, "procesos_por_archivo")}
    assert by_file == {"a.jsonl": 3, "b.jsonl": 4}
    assert rows(con, "ocid_en_varios_archivos") == [{"ocid_repetidos": 0}]
    by_year_and_file = [
        (row["anio_convocatoria"], row["archivo"], row["procesos"])
        for row in rows(con, "departamento_por_archivo_y_anio")
    ]
    assert by_year_and_file == [(2025, "b.jsonl", 1), (2026, "a.jsonl", 3)]
    con.close()


def test_process_repeated_across_files_is_reported(releases_path: Path, tmp_path: Path) -> None:
    copy = tmp_path / "copia.jsonl"
    copy.write_bytes(releases_path.read_bytes())
    con = spike.connect()
    assert spike.load_releases(con, releases_path, copy) == 14
    assert rows(con, "ocid_en_varios_archivos") == [{"ocid_repetidos": 7}]
    con.close()


def test_load_needs_a_file() -> None:
    con = spike.connect()
    with pytest.raises(ValueError, match="at least one file"):
        spike.load_releases(con)
    con.close()


def test_tenderers_of_failed_processes(loaded: duckdb.DuckDBPyConnection) -> None:
    by_flag = {
        row["todos_los_items_desiertos"]: row
        for row in rows(loaded, "postores_en_procesos_desiertos")
    }
    assert by_flag[True]["procesos"] == 2
    assert by_flag[True]["postores_q1_mediana_q3"] == [3.5, 4.0, 4.5]


def test_classification_schemes(loaded: duckdb.DuckDBPyConnection) -> None:
    schemes = {
        (row["campo"], row["esquema"]): row["procesos"]
        for row in rows(loaded, "esquemas_de_clasificacion")
    }
    assert schemes[("classification", "CUBSO")] == 5
    assert schemes[("classification", None)] == 2
    assert schemes[("additionalClassifications", "UNSPSC")] == 5
    (prefix,) = rows(loaded, "cubso_empieza_con_unspsc")
    assert prefix == {"items_con_ambos": 5, "cubso_empieza_con_unspsc": 5}


def test_final_value_coverage(loaded: duckdb.DuckDBPyConnection) -> None:
    (row,) = rows(loaded, "culminacion_en_el_departamento")
    assert row == {"contratos": 4, "con_monto_final": 1, "pct_con_monto_final": 25.0}


def test_department_counts_by_year(loaded: duckdb.DuckDBPyConnection) -> None:
    counts = {
        row["anio_convocatoria"]: row["procesos"]
        for row in rows(loaded, "departamento_por_anio_de_convocatoria")
    }
    assert counts == {2024: 1, 2025: 1, 2026: 3}


def test_quality_counts(loaded: duckdb.DuckDBPyConnection) -> None:
    (contracts,) = rows(loaded, "contratos")
    assert contracts == {"contratos": 6, "sin_estado": 2, "sin_adjudicacion_vinculada": 1}
    (awards,) = rows(loaded, "adjudicaciones")
    assert awards["sin_contrato_vinculado"] == 1
    assert awards["sin_proveedor"] == 0


def test_supplier_identifier_types(loaded: duckdb.DuckDBPyConnection) -> None:
    counts = {
        row["tipo_de_identificador"]: row["adjudicaciones"]
        for row in rows(loaded, "identificadores_de_proveedores")
    }
    assert counts == {"RUC 20": 4, "RUC 10": 1, "codigo corto (no es RUC)": 1}


def test_sample_copies_the_department_and_years_unchanged(
    releases_path: Path, tmp_path: Path
) -> None:
    sample = tmp_path / "muestra.jsonl"
    assert spike.write_sample(releases_path, sample, DEPARTMENT, YEARS) == 4
    source_lines = releases_path.read_text(encoding="utf-8").splitlines()
    assert sample.read_text(encoding="utf-8").splitlines() == source_lines[:4]


def test_sample_reads_gzip(releases_path: Path, tmp_path: Path) -> None:
    compressed = tmp_path / "releases.jsonl.gz"
    compressed.write_bytes(gzip.compress(releases_path.read_bytes()))
    assert spike.write_sample(compressed, tmp_path / "muestra.jsonl", "LAMBAYEQUE", [2026]) == 1


@pytest.mark.parametrize(
    ("release", "expected"),
    [
        (
            {"buyer": {"id": "B"}, "parties": [{"id": "B", "address": {"department": "PIURA"}}]},
            "PIURA",
        ),
        (
            {"buyer": {"id": "B"}, "parties": [{"id": "X", "address": {"department": "PIURA"}}]},
            None,
        ),
        ({"buyer": {"id": "B"}, "parties": [{"id": "B"}]}, None),
        ({"parties": [{"id": "B", "address": {"department": "PIURA"}}]}, None),
    ],
)
def test_buyer_department(release: dict[str, Any], expected: str | None) -> None:
    assert spike.buyer_department(release) == expected


def test_publication_year_handles_missing_dates() -> None:
    assert (
        spike.publication_year({"tender": {"datePublished": "2026-01-31T23:00:00-05:00"}}) == 2026
    )
    assert spike.publication_year({"tender": {}}) is None
    assert spike.publication_year({}) is None


def test_cardinal_coverage_counts_fields(releases_path: Path) -> None:
    coverage = spike.cardinal_coverage(releases_path)
    assert coverage[""] == 7
    assert coverage["/tender/numberOfTenderers"] == 6
    assert not any(path.startswith("/bids") for path in coverage)


def test_cli_spike_writes_a_report(releases_path: Path, tmp_path: Path) -> None:
    report_path = tmp_path / "spike.json"
    db_path = tmp_path / "spike.duckdb"
    assert main(["spike", str(releases_path), "--db", str(db_path), "--out", str(report_path)]) == 0
    report = json.loads(report_path.read_text(encoding="utf-8"))
    assert report["archivos"] == ["releases.jsonl"]
    assert report["departamento"] == DEPARTMENT
    assert report["anios"] == YEARS
    assert [result["nombre"] for result in report["consultas"]] == [
        query.name for query in spike.QUERIES
    ]
    # A second run reuses the database instead of reloading the file.
    assert main(["spike", str(releases_path), "--db", str(db_path), "--out", str(report_path)]) == 0


def test_cli_spike_reads_several_files(
    split_releases_paths: tuple[Path, Path], tmp_path: Path
) -> None:
    first, second = split_releases_paths
    report_path = tmp_path / "spike.json"
    arguments = [str(first), str(second), "--db", str(tmp_path / "spike.duckdb")]
    assert main(["spike", *arguments, "--out", str(report_path)]) == 0
    report = json.loads(report_path.read_text(encoding="utf-8"))
    assert report["archivos"] == ["a.jsonl", "b.jsonl"]
    (summary,) = next(r for r in report["consultas"] if r["nombre"] == "resumen")["filas"]
    assert summary[:2] == [7, 7]


def test_default_names_join_the_file_years() -> None:
    sources = [Path("data/raw/2025.jsonl.gz"), Path("data/raw/2026.jsonl.gz")]
    assert _file_stem(sources) == "2025-2026"


def test_cli_sample_and_coverage(
    releases_path: Path, tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    sample = tmp_path / "muestra.jsonl"
    assert main(["sample", str(releases_path), str(sample)]) == 0
    assert len(sample.read_text(encoding="utf-8").splitlines()) == 4
    coverage_path = tmp_path / "coverage.json"
    assert main(["coverage", str(sample), "--out", str(coverage_path)]) == 0
    assert json.loads(coverage_path.read_text(encoding="utf-8"))[""] == 4
    assert "/tender/numberOfTenderers: 3" in capsys.readouterr().out
