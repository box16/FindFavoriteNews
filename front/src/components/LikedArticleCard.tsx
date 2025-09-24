import type { NewsItem } from "../types/news";
import { NewsCard } from "./NewsCard";
import { SanitizedHtml } from "./SanitizedHtml";

type LikedArticleCardProps = {
  item: NewsItem;
};

export function LikedArticleCard({ item }: LikedArticleCardProps) {
  return (
    <NewsCard variant="tile" className="liked-card">
      {item.source ? <div className="news-card__source">{item.source}</div> : null}
      <a
        href={item.link}
        target="_blank"
        rel="noreferrer"
        className="news-card__title"
      >
        {item.title}
      </a>
      <SanitizedHtml html={item.summary} className="news-card__summary" />
    </NewsCard>
  );
}
