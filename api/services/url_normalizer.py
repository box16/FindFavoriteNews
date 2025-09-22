"""Utilities for normalizing article URLs."""
from __future__ import annotations

from urllib.parse import parse_qsl, urlparse, urlunparse, urlencode


_DEFAULT_PORTS = {
    "http": 80,
    "https": 443,
}


def normalize_article_url(raw_url: str) -> str:
    """Return a canonical representation of an article URL for de-duplication."""
    if not raw_url:
        raise ValueError("URL is empty")

    parsed = urlparse(raw_url)
    if not parsed.scheme or not parsed.netloc:
        raise ValueError("URL must include a scheme and host")

    scheme = parsed.scheme.lower()
    hostname = (parsed.hostname or "").lower()
    if hostname.startswith("www."):
        hostname = hostname[4:]

    # Strip default port information based on the original scheme.
    port = parsed.port
    default_port = _DEFAULT_PORTS.get(scheme)
    if port is None or port == default_port:
        port_segment = ""
    else:
        port_segment = f":{port}"

    # Preserve basic auth information when present.
    userinfo = ""
    if parsed.username:
        userinfo = parsed.username
        if parsed.password:
            userinfo += f":{parsed.password}"
        userinfo += "@"

    path = parsed.path or "/"
    if path != "/":
        path = path.rstrip("/")
        if not path.startswith("/"):
            path = f"/{path}"

    # Remove tracking parameters and sort remaining query keys for consistency.
    query_items = [
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if not key.lower().startswith("utm_")
    ]
    query_items.sort(key=lambda item: (item[0], item[1]))
    query = urlencode(query_items, doseq=True)

    netloc = f"{userinfo}{hostname}{port_segment}" if hostname else parsed.netloc
    normalized = urlunparse((scheme, netloc, path, "", query, ""))
    return normalized
