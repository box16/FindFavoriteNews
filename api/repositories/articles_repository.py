"""Article persistence helpers."""
from __future__ import annotations

from typing import Dict, Optional, Sequence, Tuple

from db import get_connection

_STATE_QUERY = """
select a.link,
       a.id,
       exists (
           select 1 from article_reactions ar where ar.article_id = a.id
       ) as has_reaction
from articles a
where a.link = any(%s)
"""

_INSERT_QUERY = """
insert into articles (link, guid, title, summary)
values (%s, %s, %s, %s)
returning id
"""


def fetch_article_states_by_link(links: Sequence[str]) -> Dict[str, Tuple[int, bool]]:
    """Return a mapping of link -> (article_id, has_reaction)."""
    if not links:
        return {}

    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(_STATE_QUERY, (list(links),))
            rows = cursor.fetchall()

    return {row[0]: (row[1], bool(row[2])) for row in rows}


def insert_articles(
    articles: Sequence[Tuple[str, Optional[str], str, str]]
) -> Dict[str, int]:
    """Insert new articles and return their IDs keyed by link."""
    if not articles:
        return {}

    inserted: Dict[str, int] = {}
    with get_connection() as connection:
        with connection.cursor() as cursor:
            for link, guid, title, summary in articles:
                if not title:
                    raise ValueError("Article title must be provided")
                cursor.execute(_INSERT_QUERY, (link, guid, title, summary))
                article_id = cursor.fetchone()[0]
                inserted[link] = article_id
        connection.commit()

    return inserted
