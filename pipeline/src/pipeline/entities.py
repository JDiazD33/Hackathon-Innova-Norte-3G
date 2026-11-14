"""Entity types from the entity name, shared by S05 (comparison groups) and the data package."""

from __future__ import annotations

import re

# (type, SQL LIKE pattern over the upper-case name), in order: the first match wins.
ENTITY_TYPES: tuple[tuple[str, str], ...] = (
    ("universidad", "%UNIVERSIDAD%"),
    ("municipalidad", "MUNICIPALIDAD%"),
    ("gobierno regional", "%GOBIERNO REGIONAL%"),
)
OTHER_TYPE = "otro"
# How the comparison groups of S05 are named, by type.
GROUP_LABELS = {
    "universidad": "Universidades",
    "municipalidad": "Municipalidades",
    "gobierno regional": "Unidades de gobiernos regionales",
    OTHER_TYPE: "Entidades de otro tipo",
}


def entity_type(name: str | None) -> str:
    """universidad, municipalidad, gobierno regional or otro."""
    upper = (name or "").upper()
    for kind, pattern in ENTITY_TYPES:
        if re.fullmatch(re.escape(pattern).replace("%", ".*"), upper, flags=re.DOTALL):
            return kind
    return OTHER_TYPE


def entity_type_sql(column: str) -> str:
    """The same classification as a DuckDB expression over ``column``."""
    cases = " ".join(
        f"WHEN upper({column}) LIKE '{pattern}' THEN '{kind}'" for kind, pattern in ENTITY_TYPES
    )
    return f"CASE {cases} ELSE '{OTHER_TYPE}' END"
