import type { NewsItem } from "../types/news";
import { NewsCard } from "./NewsCard";
import { SanitizedHtml } from "./SanitizedHtml";

type LikedArticleCardProps = {
  item: NewsItem;
  onRemove: (articleId: number) => void;
  isRemoving?: boolean;
  isDisabled?: boolean;
};

function TrashIcon() {
  return (
    <svg
      className="liked-card__remove-icon"
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M9 3a1 1 0 0 0-.894.553L7.382 5H5a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2h-2.382l-.724-1.447A1 1 0 0 0 15 3H9Zm-2 6a1 1 0 0 1 1 1v8a1 1 0 1 1-2 0v-8a1 1 0 0 1 1-1Zm5 0a1 1 0 0 1 1 1v8a1 1 0 1 1-2 0v-8a1 1 0 0 1 1-1Zm6 1a1 1 0 0 0-2 0v8a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3v-8a1 1 0 0 0-2 0v8a5 5 0 0 0 5 5h2a5 5 0 0 0 5-5v-8Z"
      />
    </svg>
  );
}

export function LikedArticleCard({ item, onRemove, isRemoving = false, isDisabled = false }: LikedArticleCardProps) {
  return (
    <NewsCard variant="tile" className="liked-card">
      <button
        type="button"
        className="liked-card__remove"
        aria-label="Remove from likes"
        title="Remove from likes"
        onClick={() => onRemove(item.id)}
        disabled={isDisabled || isRemoving}
        aria-busy={isRemoving}
      >
        {isRemoving ? (
          <span className="liked-card__remove-spinner" aria-hidden="true" />
        ) : (
          <TrashIcon />
        )}
      </button>
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
