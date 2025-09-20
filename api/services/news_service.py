"""Business logic for aggregating news items."""
from typing import List

from ..clients.rss_client import RSSFetchError, fetch_feed_entries
from ..repositories.sites_repository import fetch_primary_site
from ..schemas import NewsItem


class NewsServiceError(RuntimeError):
    """Base class for news-specific errors."""


class SiteNotConfiguredError(NewsServiceError):
    """Raised when no site records exist."""


class FeedUnavailableError(NewsServiceError):
    """Raised when the remote feed cannot be downloaded or parsed."""


def _map_entry(entry: dict, *, source: str) -> NewsItem:
    summary = entry.get("summary") or entry.get("description") or ""
    return {
        "title": entry.get("title", ""),
        "link": entry.get("link", ""),
        "summary": summary,
        "source": source,
    }


def get_latest_news(*, limit: int = 5) -> List[NewsItem]:
    """Return the latest news items from the configured site."""
    site = fetch_primary_site()
    if site is None:
        raise SiteNotConfiguredError("No news site is configured")

    try:
        entries = fetch_feed_entries(site.feed_url)
    except RSSFetchError as exc:
        raise FeedUnavailableError(str(exc)) from exc

    return [_map_entry(entry, source=site.name) for entry in entries[:limit]]
