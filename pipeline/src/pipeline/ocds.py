"""The OCDS compiled-release fields the pipeline reads, with explicit DuckDB types.

Reading with an explicit schema keeps the tables stable: fields that are absent become NULL
and fields the pipeline does not use are ignored.
"""

from __future__ import annotations

import duckdb

from pipeline.config import DUCKDB_TIME_ZONE

# A compiled release can be several megabytes long.
MAX_OBJECT_SIZE = 256 * 1024 * 1024


def struct(**fields: str) -> str:
    """A DuckDB STRUCT type with quoted field names (``date``, ``value``... are keywords)."""
    return "STRUCT(" + ", ".join(f'"{name}" {kind}' for name, kind in fields.items()) + ")"


def list_of(kind: str) -> str:
    return f"{kind}[]"


TIMESTAMP = "TIMESTAMP WITH TIME ZONE"
TEXT = "VARCHAR"
NUMBER = "DOUBLE"

MONEY = struct(amount=NUMBER, currency=TEXT)
PERIOD = struct(startDate=TIMESTAMP, endDate=TIMESTAMP)
ORGANIZATION = struct(id=TEXT, name=TEXT)
CLASSIFICATION = struct(id=TEXT, scheme=TEXT, description=TEXT)
DOCUMENT = struct(
    id=TEXT, documentType=TEXT, title=TEXT, url=TEXT, datePublished=TIMESTAMP, format=TEXT
)
ITEM = struct(
    id=TEXT,
    description=TEXT,
    quantity=NUMBER,
    status=TEXT,
    statusDetails=TEXT,
    unit=struct(name=TEXT),
    classification=CLASSIFICATION,
    additionalClassifications=list_of(CLASSIFICATION),
    totalValue=MONEY,
)
PARTY = struct(
    id=TEXT,
    name=TEXT,
    roles=list_of(TEXT),
    address=struct(department=TEXT, region=TEXT, locality=TEXT),
    identifier=struct(id=TEXT, scheme=TEXT, legalName=TEXT),
    additionalIdentifiers=list_of(struct(id=TEXT, scheme=TEXT)),
)
TENDER = struct(
    id=TEXT,
    title=TEXT,
    description=TEXT,
    datePublished=TIMESTAMP,
    procurementMethod=TEXT,
    procurementMethodDetails=TEXT,
    mainProcurementCategory=TEXT,
    value=struct(amount=NUMBER, currency=TEXT, amount_PEN=NUMBER),
    tenderPeriod=PERIOD,
    enquiryPeriod=PERIOD,
    numberOfTenderers="BIGINT",
    tenderers=list_of(ORGANIZATION),
    items=list_of(ITEM),
    documents=list_of(DOCUMENT),
)
AWARD = struct(id=TEXT, date=TIMESTAMP, value=MONEY, suppliers=list_of(ORGANIZATION))
CONTRACT = struct(
    id=TEXT,
    awardID=TEXT,
    title=TEXT,
    status=TEXT,
    statusDetails=TEXT,
    dateSigned=TIMESTAMP,
    value=MONEY,
    implementation=struct(finalValue=MONEY, endDate=TIMESTAMP),
    documents=list_of(DOCUMENT),
)

RELEASE_COLUMNS: dict[str, str] = {
    "ocid": TEXT,
    "id": TEXT,
    "date": TIMESTAMP,
    "buyer": ORGANIZATION,
    "parties": list_of(PARTY),
    "tender": TENDER,
    "awards": list_of(AWARD),
    "contracts": list_of(CONTRACT),
}


# Process status: there is no ``tender.status``, so it is the sorted distinct item statuses.
ITEM_STATUS_SQL = """nullif(array_to_string(list_sort(list_distinct(list_filter(
    list_transform(tender.items, lambda i: i.statusDetails),
    lambda s: s IS NOT NULL))), ', '), '')"""


def sql_string(value: str) -> str:
    """A single-quoted SQL string literal."""
    return "'" + value.replace("'", "''") + "'"


def columns_literal(columns: dict[str, str] = RELEASE_COLUMNS) -> str:
    """The ``columns`` argument of ``read_json`` as a SQL struct literal."""
    return "{" + ", ".join(f"{sql_string(k)}: {sql_string(v)}" for k, v in columns.items()) + "}"


def connect() -> duckdb.DuckDBPyConnection:
    """An in-memory DuckDB connection that reads dates in Lima time."""
    con = duckdb.connect()
    con.execute(f"SET TimeZone = '{DUCKDB_TIME_ZONE}'")
    return con
