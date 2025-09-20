from fastapi import FastAPI, HTTPException
from typing import List
from typing_extensions import TypedDict
import httpx, feedparser, psycopg, os


class NewsItem(TypedDict):
    title: str
    link: str
    summary: str
    source: str


app = FastAPI()
DATABASE_URL = os.getenv("DATABASE_URL")


def map_entry(e, source: str) -> NewsItem:
    summary = e.get("summary") or e.get("description") or ""
    return {
        "title": e.get("title", ""),
        "link": e.get("link", ""),
        "summary": summary,
        "source": source,
    }


@app.get("/news", response_model=List[NewsItem])
def get_news():
    with psycopg.connect(DATABASE_URL) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "select id, name, feed_url from sites order by id asc limit 1"
            )
            row = cursor.fetchone()
    _, site_name, feed_url = row

    try:
        with httpx.Client(timeout=15) as client:
            response = client.get(feed_url)
            response.raise_for_status()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"RSS取得に失敗: {e}")

    feed = feedparser.parse(response.content)
    items = [map_entry(e, source=site_name) for e in feed.entries[:5]]

    return items
