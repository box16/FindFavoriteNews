"""Persistence helpers for article reactions."""
from __future__ import annotations

from psycopg.errors import ForeignKeyViolation

from db import get_connection

_DELETE_QUERY = "delete from article_reactions where article_id = %s"
_INSERT_QUERY = "insert into article_reactions (article_id, value) values (%s, %s)"

class ReactionPersistenceError(RuntimeError):
    """Raised when reaction persistence fails."""

class UnknownArticleError(ReactionPersistenceError):
    """Raised when the referenced article does not exist."""

def set_reaction(article_id: int, value: int) -> None:
    """Store the reaction value for the article, replacing any previous record."""
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(_DELETE_QUERY, (article_id,))
            try:
                cursor.execute(_INSERT_QUERY, (article_id, value))
            except ForeignKeyViolation as exc:
                connection.rollback()
                raise UnknownArticleError(f"Article {article_id} does not exist") from exc
        connection.commit()
