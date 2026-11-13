"""Command-line entry point: ``uv run pipeline <command>`` (run it from ``pipeline/``)."""

from __future__ import annotations

import argparse
import sys
import time
from collections.abc import Sequence
from pathlib import Path

from pipeline import spike

DEFAULT_DEPARTMENT = "LA LIBERTAD"
DEFAULT_YEARS = (2025, 2026)


def _file_stem(source: Path) -> str:
    """``2026.jsonl.gz`` -> ``2026``."""
    return source.name.split(".")[0]


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
    spike_parser.add_argument("source", type=Path, help="archivo OCDS .jsonl o .jsonl.gz")
    _add_scope_arguments(spike_parser)
    spike_parser.add_argument(
        "--db", type=Path, help="base DuckDB (por defecto, data/interim/spike-<año>.duckdb)"
    )
    spike_parser.add_argument(
        "--out", type=Path, help="informe JSON (por defecto, data/derived/spike-<año>.json)"
    )
    spike_parser.add_argument(
        "--reload", action="store_true", help="vuelve a cargar el archivo aunque la base exista"
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
    return parser


def _run_spike(args: argparse.Namespace) -> int:
    stem = _file_stem(args.source)
    db = args.db or _data_dir(args.source) / "interim" / f"spike-{stem}.duckdb"
    out = args.out or _data_dir(args.source) / "derived" / f"spike-{stem}.json"
    db.parent.mkdir(parents=True, exist_ok=True)
    reload = args.reload or not db.exists()
    con = spike.connect(db)
    try:
        if reload:
            started = time.perf_counter()
            loaded = spike.load_releases(con, args.source)
            elapsed = time.perf_counter() - started
            print(f"Cargados {loaded} procesos de {args.source.name} en {elapsed:.0f} s")
        else:
            con.execute(spike.PROCESOS_VIEW)
            print(f"Usando la base existente {db} (usa --reload para recargar)")
        results = spike.run_queries(con, args.department, args.years)
    finally:
        con.close()
    spike.write_json(spike.build_report(args.source, results, args.department, args.years), out)
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
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    handlers = {"spike": _run_spike, "sample": _run_sample, "coverage": _run_coverage}
    return handlers[args.command](args)


if __name__ == "__main__":
    raise SystemExit(main())
