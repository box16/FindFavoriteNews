"""Application configuration helpers."""
from functools import lru_cache
import os


class SettingsError(RuntimeError):
    """Raised when required settings are missing or invalid."""


@lru_cache()
def get_database_url() -> str:
    """Fetch the database URL from the environment, ensuring it is available."""
    value = os.getenv("DATABASE_URL")
    if not value:
        raise SettingsError("DATABASE_URL is not configured")
    return value
