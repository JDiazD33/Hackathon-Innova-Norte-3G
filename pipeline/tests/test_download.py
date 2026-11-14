"""Tests for the download step and its list of allowed sources (task 2.1)."""

from __future__ import annotations

import hashlib
import io
import json
import re
import urllib.request
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest
from factories import write_config

from pipeline.config import load_config
from pipeline.download import (
    AllowListRedirectHandler,
    DownloadError,
    SourceNotAllowedError,
    download_all,
    download_file,
    is_allowed,
    metadata_path,
)

ALLOWED = ("https://data.example.org/descargas", "https://cdn.example.org/archivos")
URL = "https://data.example.org/descargas?name=2026.jsonl.gz"
FINAL_URL = "https://cdn.example.org/archivos/4263/2026.jsonl.gz"
BODY = b'{"ocid": "ocds-prueba-0001"}\n' * 50


class FakeResponse(io.BytesIO):
    def __init__(self, body: bytes, url: str, headers: dict[str, str]) -> None:
        super().__init__(body)
        self._url = url
        self.headers = headers

    def geturl(self) -> str:
        return self._url


def fake_opener(
    calls: list[str],
    body: bytes = BODY,
    final_url: str = FINAL_URL,
    content_length: int | None = None,
) -> Callable[[urllib.request.Request], Any]:
    def open_url(request: urllib.request.Request) -> FakeResponse:
        calls.append(request.full_url)
        headers = {
            "Content-Length": str(len(body) if content_length is None else content_length),
            "Last-Modified": "Sun, 04 Oct 2026 13:58:49 GMT",
        }
        return FakeResponse(body, final_url, headers)

    return open_url


@pytest.mark.parametrize(
    ("url", "expected"),
    [
        (URL, True),
        (FINAL_URL, True),
        ("https://DATA.example.org/descargas?name=x", True),
        ("http://data.example.org/descargas?name=x", False),
        ("https://data.example.org.otro.test/descargas?name=x", False),
        ("https://data.example.org/descargas-falsas?name=x", False),
        ("https://otro.example.org/descargas?name=x", False),
    ],
)
def test_is_allowed(url: str, expected: bool) -> None:
    assert is_allowed(url, ALLOWED) is expected


def test_allowed_source_is_downloaded_and_recorded(tmp_path: Path) -> None:
    calls: list[str] = []
    destination = tmp_path / "raw" / "2026.jsonl.gz"
    record, downloaded = download_file(URL, destination, ALLOWED, open_url=fake_opener(calls))
    assert downloaded
    assert calls == [URL]
    assert destination.read_bytes() == BODY
    assert record["url"] == URL
    assert record["url_final"] == FINAL_URL
    assert record["bytes"] == len(BODY)
    assert record["sha256"] == hashlib.sha256(BODY).hexdigest()
    assert record["ultima_modificacion"] == "2026-10-04T08:58:49-05:00"
    assert json.loads(metadata_path(destination).read_text(encoding="utf-8")) == record


def test_disallowed_source_stops_before_downloading(tmp_path: Path) -> None:
    calls: list[str] = []
    url = "https://otro.example.org/datos?name=2026.jsonl.gz"
    destination = tmp_path / "raw" / "2026.jsonl.gz"
    with pytest.raises(SourceNotAllowedError, match=re.escape(url)):
        download_file(url, destination, ALLOWED, open_url=fake_opener(calls))
    assert calls == []
    assert not destination.exists()


def test_redirects_are_checked_against_the_list() -> None:
    handler = AllowListRedirectHandler(ALLOWED)
    request = urllib.request.Request(URL)
    with pytest.raises(SourceNotAllowedError, match=re.escape("https://otro.test/x")):
        handler.redirect_request(request, None, 302, "Found", {}, "https://otro.test/x")
    redirected = handler.redirect_request(request, None, 302, "Found", {}, FINAL_URL)
    assert redirected.full_url == FINAL_URL


def test_final_url_outside_the_list_is_refused(tmp_path: Path) -> None:
    calls: list[str] = []
    destination = tmp_path / "raw" / "2026.jsonl.gz"
    opener = fake_opener(calls, final_url="https://otro.test/2026.jsonl.gz")
    with pytest.raises(SourceNotAllowedError, match=r"otro\.test"):
        download_file(URL, destination, ALLOWED, open_url=opener)
    assert not destination.exists()
    assert list(destination.parent.iterdir()) == []


def test_incomplete_download_is_discarded(tmp_path: Path) -> None:
    calls: list[str] = []
    destination = tmp_path / "raw" / "2026.jsonl.gz"
    opener = fake_opener(calls, content_length=len(BODY) + 10)
    with pytest.raises(DownloadError, match="incompleta"):
        download_file(URL, destination, ALLOWED, open_url=opener)
    assert list(destination.parent.iterdir()) == []


def test_existing_download_is_not_repeated_unless_forced(tmp_path: Path) -> None:
    destination = tmp_path / "raw" / "2026.jsonl.gz"
    download_file(URL, destination, ALLOWED, open_url=fake_opener([]))
    calls: list[str] = []
    record, downloaded = download_file(URL, destination, ALLOWED, open_url=fake_opener(calls))
    assert not downloaded
    assert calls == []
    assert record["bytes"] == len(BODY)
    _, downloaded = download_file(
        URL, destination, ALLOWED, open_url=fake_opener(calls), force=True
    )
    assert downloaded
    assert calls == [URL]


def test_download_all_uses_the_configured_files(tmp_path: Path) -> None:
    config = load_config(write_config(tmp_path))
    calls: list[str] = []
    results = download_all(config, tmp_path / "data", open_url=fake_opener(calls))
    assert calls == [
        "https://data.example.org/descargas?name=2025.jsonl.gz",
        "https://data.example.org/descargas?name=2026.jsonl.gz",
    ]
    assert [record["archivo"] for record, _ in results] == ["2025.jsonl.gz", "2026.jsonl.gz"]
    assert (tmp_path / "data" / "raw" / "2025.jsonl.gz").exists()
