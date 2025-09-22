from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel
from typing import List

from config import SettingsError
from schemas import NewsItem
from services.news_service import (
    ArticleNotFoundError,
    FeedUnavailableError,
    InvalidReactionError,
    SiteNotConfiguredError,
    get_latest_news,
    record_reaction,
)


app = FastAPI()


class ReactionPayload(BaseModel):
    value: int


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


@app.post("/articles/{article_id}/reaction", status_code=204)
def post_reaction(article_id: int, payload: ReactionPayload):
    try:
        record_reaction(article_id=article_id, value=payload.value)
    except InvalidReactionError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ArticleNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except SettingsError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return Response(status_code=204)
