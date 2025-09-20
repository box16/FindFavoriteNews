from fastapi import FastAPI, HTTPException
from typing import List

from config import SettingsError
from schemas import NewsItem
from services.news_service import (
    FeedUnavailableError,
    SiteNotConfiguredError,
    get_latest_news,
)


app = FastAPI()


@app.get("/news", response_model=List[NewsItem])
def get_news():
    try:
        return get_latest_news(limit=5)
    except SiteNotConfiguredError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except FeedUnavailableError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except SettingsError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
