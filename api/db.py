"""Database utilities for managing connections."""
from contextlib import contextmanager
from typing import Iterator

import psycopg

from config import get_database_url


@contextmanager
def get_connection() -> Iterator[psycopg.Connection]:
    """Provide a psycopg connection that is always closed afterwards."""
    connection = psycopg.connect(get_database_url())
    try:
        yield connection
    finally:
        connection.close()
