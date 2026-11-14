"""What every signal rule receives besides the DuckDB connection and the configuration."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from pathlib import Path


@dataclass(frozen=True)
class RuleContext:
    region_label: str  # for the description of the comparison groups, e.g. "La Libertad"
    cut_date: date  # last day covered by the data (fecha de corte)
    output_dir: Path  # data/derived/senales, where rules may write extra files


class SignalUnavailable(RuntimeError):
    """The data do not allow computing the signal; the message is the reason in the manifest."""
