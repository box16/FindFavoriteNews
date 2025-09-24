"""Business logic for aggregating news items."""
from __future__ import annotations

from random import shuffle
from typing import List, Sequence, Tuple

from clients.rss_client import RSSFetchError, fetch_feed_entries
from repositories.article_reactions_repository import (
    UnknownArticleError,
    set_reaction,
)
from repositories.articles_repository import (
    fetch_article_states_by_link,
    insert_articles,
)
from repositories.sites_repository import fetch_random_sites
from schemas import NewsItem, Site
from services.url_normalizer import normalize_article_url


_SITE_SAMPLE_LIMIT = 10
_PER_SITE_ENTRY_LIMIT = 5
_MAX_RESPONSE_ITEMS = 30


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


def _prepare_entries(
    candidates: Sequence[Tuple[dict, Site]],
    *,
    max_candidates: int,
) -> List[dict]:
    """Normalise links and return up to `max_candidates` prepared entries."""
    prepared: List[dict] = []
    seen_links: set[str] = set()

    for entry, site in candidates:
        raw_link = entry.get("link")
        if not raw_link:
            continue

        try:
            normalised_link = normalize_article_url(raw_link)
        except ValueError:
            continue

        if normalised_link in seen_links:
            continue

        title = entry.get("title")
        if not title:
            continue

        summary = entry.get("description") or entry.get("summary") or ""

        seen_links.add(normalised_link)
        prepared.append(
            {
                "link": normalised_link,
                "guid": entry.get("id") or entry.get("guid"),
                "title": title,
                "summary": summary,
                "source": site.name,
            }
        )

        if len(prepared) >= max_candidates:
            break

    return prepared


def get_latest_news(
    *,
    max_sites: int = _SITE_SAMPLE_LIMIT,
    per_site_limit: int = _PER_SITE_ENTRY_LIMIT,
    max_items: int = _MAX_RESPONSE_ITEMS,
) -> List[NewsItem]:
    """Return up to `max_items` unreacted news items sampled across sites."""
    sites = fetch_random_sites(max_sites)
    if not sites:
        raise SiteNotConfiguredError("No news site is configured")

    candidates: List[Tuple[dict, Site]] = []
    for site in sites:
        try:
            entries = fetch_feed_entries(site.feed_url)
        except RSSFetchError:
            # Ignore feeds that temporarily fail and continue with others.
            continue

        for entry in entries[:per_site_limit]:
            candidates.append((entry, site))

    if not candidates:
        raise FeedUnavailableError("No feed entries available")

    shuffle(candidates)
    prepared = _prepare_entries(candidates, max_candidates=max_items)

    if not prepared:
        return []

    links = list({item["link"] for item in prepared})
    existing_states = fetch_article_states_by_link(links)

    fresh_entries = [item for item in prepared if item["link"] not in existing_states]
    inserted = insert_articles(
        [
            (item["link"], item["guid"], item["title"], item["summary"])
            for item in fresh_entries
        ]
    )

    news_items: List[NewsItem] = []
    for item in prepared:
        if len(news_items) >= max_items:
            break

        link = item["link"]
        article_id = inserted.get(link)

        if article_id is None:
            state = existing_states.get(link)
            if state is None or state[1]:  # Already reacted
                continue
            article_id = state[0]

        news_items.append(
            NewsItem(
                id=article_id,
                title=item["title"],
                link=item["link"],
                summary=item["summary"],
                source=item["source"],
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
