"""Queries related to news sites."""
from typing import Optional

from db import get_connection
from schemas import Site


_SITE_QUERY = "select id, name, feed_url from sites order by id asc limit 1"


def fetch_primary_site() -> Optional[Site]:
    """Return the primary configured site, if any."""
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(_SITE_QUERY)
            row = cursor.fetchone()

    if row is None:
        return None

    site_id, name, feed_url = row
    return Site(id=site_id, name=name, feed_url=feed_url)
