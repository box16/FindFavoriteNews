import type { NewsItem } from "../types/news";
import { SanitizedHtml } from "./SanitizedHtml";

type LikedArticleCardProps = {
  item: NewsItem;
};

export function LikedArticleCard({ item }: LikedArticleCardProps) {
  return (
    <article className="liked-card">
      {item.source ? <div className="liked-card__source">{item.source}</div> : null}
      <a
        href={item.link}
        target="_blank"
        rel="noreferrer"
        className="liked-card__title"
      >
        {item.title}
      </a>
      <SanitizedHtml html={item.summary} className="liked-card__summary" />
    </article>
  );
}
