"""Command-line entry point: ``uv run pipeline <command>`` (run it from ``pipeline/``)."""

from __future__ import annotations

import argparse
import sys
import time
from collections.abc import Sequence
from pathlib import Path

from pipeline import spike
from pipeline.config import DEFAULT_CONFIG, DEFAULT_DATA_DIR, ConfigError, load_config
from pipeline.download import DownloadError, SourceNotAllowedError, download_all
from pipeline.ingest import ingest
from pipeline.normalize import StaleIngestError, normalize
from pipeline.signals.compute import compute_signals
from pipeline.signals.settings import DEFAULT_SIGNALS_CONFIG, load_signals_config

DEFAULT_DEPARTMENT = "LA LIBERTAD"
DEFAULT_YEARS = (2025, 2026)


def _file_stem(sources: list[Path]) -> str:
    """``[2025.jsonl.gz, 2026.jsonl.gz]`` -> ``2025-2026``."""
    return "-".join(source.name.split(".")[0] for source in sources)


def _data_dir(source: Path) -> Path:
    """``data/raw/2026.jsonl.gz`` -> ``data/`` (where ``interim/`` and ``derived/`` live)."""
    return source.resolve().parent.parent


def _add_scope_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--department",
        default=DEFAULT_DEPARTMENT,
        help=f"departamento del comprador (por defecto, {DEFAULT_DEPARTMENT})",
    )
    parser.add_argument(
        "--years",
        type=int,
        nargs="+",
        default=list(DEFAULT_YEARS),
        help="años de convocatoria (por defecto, 2025 2026)",
    )


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="pipeline",
        description="Pipeline del Lote A: datos OCDS del OECE -> señales de revisión.",
    )
    commands = parser.add_subparsers(dest="command", required=True)

    spike_parser = commands.add_parser(
        "spike", help="responde Q1-Q7 con consultas DuckDB y escribe un informe JSON"
    )
    spike_parser.add_argument(
        "sources", type=Path, nargs="+", help="uno o más archivos OCDS .jsonl o .jsonl.gz"
    )
    _add_scope_arguments(spike_parser)
    spike_parser.add_argument(
        "--db", type=Path, help="base DuckDB (por defecto, data/interim/spike-<años>.duckdb)"
    )
    spike_parser.add_argument(
        "--out", type=Path, help="informe JSON (por defecto, data/derived/spike-<años>.json)"
    )
    spike_parser.add_argument(
        "--reload", action="store_true", help="vuelve a cargar los archivos aunque la base exista"
    )

    sample_parser = commands.add_parser(
        "sample", help="copia los procesos de un departamento y unos años (muestra para Cardinal)"
    )
    sample_parser.add_argument("source", type=Path, help="archivo OCDS .jsonl o .jsonl.gz")
    sample_parser.add_argument("destination", type=Path, help="archivo .jsonl de salida")
    _add_scope_arguments(sample_parser)

    coverage_parser = commands.add_parser(
        "coverage", help="ejecuta ocdscardinal.coverage y muestra los campos de las señales"
    )
    coverage_parser.add_argument("source", type=Path, help="archivo OCDS .jsonl")
    coverage_parser.add_argument("--out", type=Path, help="guarda la cobertura completa en JSON")

    download_parser = commands.add_parser(
        "download", help="descarga los archivos configurados, solo desde fuentes permitidas"
    )
    _add_pipeline_arguments(download_parser)
    download_parser.add_argument(
        "--force", action="store_true", help="vuelve a descargar aunque el archivo ya exista"
    )

    ingest_parser = commands.add_parser(
        "ingest", help="conserva los procesos del departamento y los años configurados"
    )
    _add_pipeline_arguments(ingest_parser)

    normalize_parser = commands.add_parser(
        "normalize", help="escribe las tablas normalizadas en Parquet y el manifiesto"
    )
    _add_pipeline_arguments(normalize_parser)

    signals_parser = commands.add_parser(
        "signals", help="calcula las señales activas sobre las tablas normalizadas"
    )
    _add_pipeline_arguments(signals_parser)
    signals_parser.add_argument(
        "--signals-config",
        type=Path,
        default=DEFAULT_SIGNALS_CONFIG,
        help="parámetros de las señales (por defecto, config/senales.toml)",
    )
    return parser


def _add_pipeline_arguments(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--config",
        type=Path,
        default=DEFAULT_CONFIG,
        help="archivo de configuración (por defecto, config/pipeline.toml)",
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=DEFAULT_DATA_DIR,
        help="carpeta de datos con raw/, interim/ y derived/ (por defecto, ../data)",
    )


def _run_download(args: argparse.Namespace) -> int:
    config = load_config(args.config)
    for record, downloaded in download_all(config, args.data_dir, force=args.force):
        state = "descargado" if downloaded else "ya estaba descargado"
        print(f"{record['archivo']}: {state}, {record['bytes']} bytes, SHA-256 {record['sha256']}")
    return 0


def _run_ingest(args: argparse.Namespace) -> int:
    config = load_config(args.config)
    started = time.perf_counter()
    summary = ingest(config, args.data_dir)
    elapsed = time.perf_counter() - started
    read = ", ".join(f"{name}: {count}" for name, count in summary["leidos"].items())
    print(f"Leídos ({read}) en {elapsed:.0f} s")
    years = ", ".join(str(year) for year in summary["anios"])
    print(f"Procesos de {summary['departamento']} ({years}): {summary['procesos']}")
    for item in summary["exclusiones"]:
        print(f"Excluidos por {item['motivo']}: {item['cantidad']}")
    for item in summary["correcciones"]:
        print(f"Corrección '{item['tipo']}': {item['cantidad']}")
    return 0


def _run_normalize(args: argparse.Namespace) -> int:
    config = load_config(args.config)
    manifest = normalize(config, args.data_dir)
    for table, count in manifest["conteos"].items():
        print(f"{table}: {count} filas")
    for item in manifest["correcciones"]:
        print(f"Corrección '{item['tipo']}': {item['cantidad']}")
    print(f"Fecha de corte: {manifest['fecha_corte']}")
    return 0


def _run_signals(args: argparse.Namespace) -> int:
    config = load_config(args.config)
    settings = load_signals_config(args.signals_config)
    manifest = compute_signals(config, settings, args.data_dir)
    for code in manifest["senales_activas"]:
        version = manifest["versiones"][code]
        print(f"{code} ({version}): {manifest['conteos'][code]} señales")
    for item in manifest["senales_desactivadas"]:
        print(f"{item['codigo']} desactivada: {item['motivo']}")
    for item in manifest["exclusiones"]:
        if item["cantidad"]:
            print(f"{item['codigo']} no evaluada por {item['motivo']}: {item['cantidad']}")
    if manifest["metodos_sin_clasificar"]:
        print("Métodos sin clasificar: " + ", ".join(manifest["metodos_sin_clasificar"]))
    return 0


def _run_spike(args: argparse.Namespace) -> int:
    sources: list[Path] = args.sources
    stem = _file_stem(sources)
    db = args.db or _data_dir(sources[0]) / "interim" / f"spike-{stem}.duckdb"
    out = args.out or _data_dir(sources[0]) / "derived" / f"spike-{stem}.json"
    db.parent.mkdir(parents=True, exist_ok=True)
    reload = args.reload or not db.exists()
    con = spike.connect(db)
    try:
        if reload:
            started = time.perf_counter()
            loaded = spike.load_releases(con, *sources)
            elapsed = time.perf_counter() - started
            names = ", ".join(source.name for source in sources)
            print(f"Cargados {loaded} procesos de {names} en {elapsed:.0f} s")
        else:
            con.execute(spike.PROCESOS_VIEW)
            print(f"Usando la base existente {db} (usa --reload para recargar)")
        results = spike.run_queries(con, args.department, args.years)
    finally:
        con.close()
    spike.write_json(spike.build_report(sources, results, args.department, args.years), out)
    for result in results:
        print()
        print(spike.format_result(result))
    print(f"\nInforme: {out}")
    return 0


def _run_sample(args: argparse.Namespace) -> int:
    copied = spike.write_sample(args.source, args.destination, args.department, args.years)
    years = ", ".join(str(year) for year in args.years)
    print(f"{copied} procesos de {args.department} ({years}) -> {args.destination}")
    return 0


def _run_coverage(args: argparse.Namespace) -> int:
    coverage = spike.cardinal_coverage(args.source)
    if args.out:
        spike.write_json(coverage, args.out)
    for path in spike.KEY_COVERAGE_PATHS:
        print(f"{path or '(procesos)'}: {coverage.get(path, 0)}")
    if args.out:
        print(f"\nCobertura completa: {args.out}")
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    handlers = {
        "spike": _run_spike,
        "sample": _run_sample,
        "coverage": _run_coverage,
        "download": _run_download,
        "ingest": _run_ingest,
        "normalize": _run_normalize,
        "signals": _run_signals,
    }
    try:
        return handlers[args.command](args)
    except (
        ConfigError,
        SourceNotAllowedError,
        DownloadError,
        FileNotFoundError,
        StaleIngestError,
    ) as error:
        print(f"Error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
