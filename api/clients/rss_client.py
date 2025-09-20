"""HTTP client wrapper for retrieving RSS/Atom feeds."""
from typing import Any, List, Mapping

import feedparser
import httpx


class RSSFetchError(RuntimeError):
    """Raised when the RSS feed cannot be downloaded or parsed."""


def fetch_feed_entries(feed_url: str, *, timeout: float = 15.0) -> List[Mapping[str, Any]]:
    """Fetch and parse the entries in the remote feed."""
    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.get(feed_url)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise RSSFetchError(f"Failed to download feed: {exc}") from exc

    feed = feedparser.parse(response.content)
    if getattr(feed, "bozo", False):
        reason = getattr(feed, "bozo_exception", "unknown parser error")
        raise RSSFetchError(f"Failed to parse feed: {reason}")

    return list(feed.entries)
