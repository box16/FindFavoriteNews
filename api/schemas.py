"""Data structures shared across the API layer."""
from dataclasses import dataclass
from typing_extensions import TypedDict


class NewsItem(TypedDict):
    id: int
    title: str
    link: str
    summary: str
    source: str


@dataclass
class Site:
    id: int
    name: str
    feed_url: str
