"""Business logic for aggregating news items."""
from __future__ import annotations

from typing import List

from clients.rss_client import RSSFetchError, fetch_feed_entries
from repositories.article_reactions_repository import (
    UnknownArticleError,
    set_reaction,
)
from repositories.articles_repository import (
    fetch_article_states_by_link,
    insert_articles,
)
from repositories.sites_repository import fetch_primary_site
from schemas import NewsItem
from services.url_normalizer import normalize_article_url


class NewsServiceError(RuntimeError):
    """Base class for news-specific errors."""


class SiteNotConfiguredError(NewsServiceError):
    """Raised when no site records exist."""


class FeedUnavailableError(NewsServiceError):
    """Raised when the remote feed cannot be downloaded or parsed."""


class InvalidReactionError(NewsServiceError):
    """Raised when the provided reaction value is invalid."""


class ArticleNotFoundError(NewsServiceError):
    """Raised when a reaction references an unknown article."""


def _prepare_entries(entries: List[dict], *, limit: int) -> List[dict]:
    """Return the first `limit` valid entries with normalised links."""
    prepared: List[dict] = []
    seen_links: set[str] = set()

    for entry in entries[:limit]:
        raw_link = entry.get("link")
        if not raw_link:
            continue

        try:
            normalised_link = normalize_article_url(raw_link)
        except ValueError:
            continue

        if normalised_link in seen_links:
            continue
        seen_links.add(normalised_link)

        prepared.append(
            {
                "link": normalised_link,
                "guid": entry.get("id") or entry.get("guid"),
                "title": entry.get("title", ""),
                "summary": entry.get("summary") or entry.get("description") or "",
            }
        )

    return prepared


def get_latest_news(*, limit: int = 5) -> List[NewsItem]:
    """Return news items that still need a reaction."""
    site = fetch_primary_site()
    if site is None:
        raise SiteNotConfiguredError("No news site is configured")

    try:
        entries = fetch_feed_entries(site.feed_url)
    except RSSFetchError as exc:
        raise FeedUnavailableError(str(exc)) from exc

    prepared = _prepare_entries(entries, limit=limit)
    existing_states = fetch_article_states_by_link([item["link"] for item in prepared])

    fresh_entries = [item for item in prepared if item["link"] not in existing_states]
    inserted = insert_articles([(item["link"], item["guid"]) for item in fresh_entries])

    news_items: List[NewsItem] = []
    for item in prepared:
        link = item["link"]
        article_id = inserted.get(link)

        if article_id is None:
            state = existing_states.get(link)
            if state is None or state[1]:  # already reacted
                continue
            article_id = state[0]

        news_items.append(
            NewsItem(
                id=article_id,
                title=item["title"],
                link=item["link"],
                summary=item["summary"],
                source=site.name,
            )
        )

    return news_items


def record_reaction(*, article_id: int, value: int) -> None:
    """Persist the user's reaction for the specified article."""
    if value not in (-1, 0, 1):
        raise InvalidReactionError("Reaction value must be -1, 0, or 1")

    try:
        set_reaction(article_id, value)
    except UnknownArticleError as exc:
        raise ArticleNotFoundError(str(exc)) from exc
