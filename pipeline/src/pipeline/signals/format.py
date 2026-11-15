"""How the signals write numbers in their texts: the es-PE format that the web uses."""

from __future__ import annotations


def percent(value: float) -> str:
    """0.0913 -> '9.1%', 0.05 -> '5%'."""
    text = f"{value * 100:.1f}"
    return (text[:-2] if text.endswith(".0") else text) + "%"
