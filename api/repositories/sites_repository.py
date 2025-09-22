"""Queries related to news sites."""
from __future__ import annotations

from typing import List

from db import get_connection
from schemas import Site

_SITES_QUERY = "select id, name, feed_url from sites order by random() limit %s"


def fetch_random_sites(limit: int) -> List[Site]:
    """Return up to `limit` randomly sampled sites."""
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(_SITES_QUERY, (limit,))
            rows = cursor.fetchall()

    return [Site(id=row[0], name=row[1], feed_url=row[2]) for row in rows]
