"""Download step (task 2.1): fetch the yearly OCDS files only from allowed sources."""

from __future__ import annotations

import hashlib
import json
import urllib.request
from collections.abc import Callable, Sequence
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

from pipeline.config import LIMA, PipelineConfig, now_in_lima

USER_AGENT = "pipeline-lote-a/0.1"
CHUNK_SIZE = 1024 * 1024
TIMEOUT_SECONDS = 120

Opener = Callable[[urllib.request.Request], Any]


class SourceNotAllowedError(RuntimeError):
    """The URL is not in the configured list of allowed sources."""


class DownloadError(RuntimeError):
    """The download did not complete as expected."""


def is_allowed(url: str, allowed_sources: Sequence[str]) -> bool:
    """True if ``url`` has the scheme and host of an allowed source and sits under its path."""
    target = urlsplit(url)
    for source in allowed_sources:
        allowed = urlsplit(source)
        if target.scheme != allowed.scheme or target.netloc.lower() != allowed.netloc.lower():
            continue
        base = allowed.path.rstrip("/")
        if target.path == base or target.path.startswith(base + "/"):
            return True
    return False


def check_allowed(url: str, allowed_sources: Sequence[str]) -> None:
    """Stop with an error that names ``url`` if it is not an allowed source."""
    if not is_allowed(url, allowed_sources):
        raise SourceNotAllowedError(
            f"Fuente no permitida: {url}. Solo se descarga desde las direcciones de "
            "descarga.fuentes_permitidas en config/pipeline.toml."
        )


class AllowListRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Follow a redirect only if its target is also an allowed source."""

    def __init__(self, allowed_sources: Sequence[str]) -> None:
        super().__init__()
        self.allowed_sources = tuple(allowed_sources)

    def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[override]
        check_allowed(newurl, self.allowed_sources)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def default_opener(allowed_sources: Sequence[str]) -> Opener:
    opener = urllib.request.build_opener(AllowListRedirectHandler(allowed_sources))
    return lambda request: opener.open(request, timeout=TIMEOUT_SECONDS)


def metadata_path(destination: Path) -> Path:
    """Where the download record of ``destination`` is kept (next to the file)."""
    return destination.with_name(destination.name + ".meta.json")


def _last_modified(value: str | None) -> str | None:
    if not value:
        return None
    try:
        return parsedate_to_datetime(value).astimezone(LIMA).isoformat(timespec="seconds")
    except (TypeError, ValueError):
        return None


def download_file(
    url: str,
    destination: Path,
    allowed_sources: Sequence[str],
    open_url: Opener | None = None,
    force: bool = False,
) -> tuple[dict[str, Any], bool]:
    """Download ``url`` to ``destination`` and record the URL, date, size and SHA-256.

    Returns the download record and whether the file was downloaded (False when an existing
    file already matches its record).
    """
    check_allowed(url, allowed_sources)
    record_path = metadata_path(destination)
    if not force and destination.exists() and record_path.exists():
        record = json.loads(record_path.read_text(encoding="utf-8"))
        if record.get("bytes") == destination.stat().st_size:
            return record, False

    opener = open_url or default_opener(allowed_sources)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    destination.parent.mkdir(parents=True, exist_ok=True)
    partial = destination.with_name(destination.name + ".part")
    digest = hashlib.sha256()
    size = 0
    try:
        with opener(request) as response:
            final_url = response.geturl()
            check_allowed(final_url, allowed_sources)
            expected = response.headers.get("Content-Length")
            last_modified = response.headers.get("Last-Modified")
            with partial.open("wb") as output:
                while chunk := response.read(CHUNK_SIZE):
                    output.write(chunk)
                    digest.update(chunk)
                    size += len(chunk)
        if expected is not None and int(expected) != size:
            raise DownloadError(
                f"Descarga incompleta de {url}: se esperaban {expected} bytes y llegaron {size}"
            )
        partial.replace(destination)
    finally:
        partial.unlink(missing_ok=True)

    record = {
        "archivo": destination.name,
        "url": url,
        "url_final": final_url,
        "descargado": now_in_lima(),
        "bytes": size,
        "sha256": digest.hexdigest(),
        "ultima_modificacion": _last_modified(last_modified),
    }
    record_path.write_text(
        json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return record, True


def download_all(
    config: PipelineConfig, data_dir: Path, open_url: Opener | None = None, force: bool = False
) -> list[tuple[dict[str, Any], bool]]:
    """Download every configured file into ``data_dir/raw``."""
    results = []
    for name in config.download.files:
        url = config.download.url_template.format(archivo=name)
        destination = data_dir / "raw" / name
        results.append(
            download_file(url, destination, config.download.allowed_sources, open_url, force)
        )
    return results
