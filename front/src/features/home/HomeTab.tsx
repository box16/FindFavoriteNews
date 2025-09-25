import { useEffect, useMemo, useState } from "react";

import { REACTIONS, reactionByKey, reactionLabelMap, type ReactionKey } from "../../constants/reactions";
import { AsyncBoundary } from "../../components/AsyncBoundary";
import { NewsCard } from "../../components/NewsCard";
import { SanitizedHtml } from "../../components/SanitizedHtml";
import { useArticleReaction } from "../../hooks/useArticleReaction";
import { useNewsFeed } from "../../hooks/useNewsFeed";

const MAX_VISIBLE_STACK = 4;
const MAX_STACK_DEPTH = MAX_VISIBLE_STACK - 1;
const MAX_FEED_ITEMS = 30;

type HomeTabProps = {
  onReactionComplete?: (value: number) => void;
  reloadToken?: number;
};

export function HomeTab({ onReactionComplete, reloadToken = 0 }: HomeTabProps) {
  const { items, error, isLoading, refresh } = useNewsFeed();
  const cappedItems = useMemo(() => items.slice(0, MAX_FEED_ITEMS), [items]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastReaction, setLastReaction] = useState<{
    title: string;
    reaction: ReactionKey;
  } | null>(null);

  const { submitReaction, isSubmitting, error: reactionError } = useArticleReaction();

  useEffect(() => {
    setCurrentIndex(0);
    setLastReaction(null);
  }, [cappedItems]);

  useEffect(() => {
    if (!reloadToken) {
      return;
    }
    void refresh({ force: true });
  }, [reloadToken, refresh]);

  const remainingItems = cappedItems.slice(currentIndex);
  const visibleStack = remainingItems.slice(0, MAX_VISIBLE_STACK);

  const handleRate = async (reactionKey: ReactionKey) => {
    const ratedItem = cappedItems[currentIndex];
    if (!ratedItem || isSubmitting) return;

    const reaction = reactionByKey[reactionKey];
    const succeeded = await submitReaction(ratedItem.id, reaction.value);
    if (!succeeded) return;

    setLastReaction({ title: ratedItem.title, reaction: reactionKey });
    setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, cappedItems.length));
    onReactionComplete?.(reaction.value);
  };

  return (
    <AsyncBoundary
      isLoading={isLoading}
      error={error}
      isEmpty={!remainingItems.length}
      loadingMessage="Loading..."
      emptyMessage="You're all caught up"
      emptyVariant="inline"
      onRetry={() => {
          }}
    >
      <>
        <div className="news-stack">
          {visibleStack.map((item, stackIndex) => (
            <NewsCard
              key={item.id}
              depth={Math.min(stackIndex, MAX_STACK_DEPTH)}
              isTop={stackIndex === 0}
            >
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="news-card__title"
              >
                {item.title}
              </a>
              <div className="news-card__source">{item.source}</div>
              <SanitizedHtml html={item.summary} className="news-card__summary" />
            </NewsCard>
          ))}
        </div>

        <div className="card-actions">
          {REACTIONS.map((reaction) => (
            <button
              key={reaction.key}
              type="button"
              className={`card-button card-button--${reaction.buttonModifier}`}
              onClick={() => handleRate(reaction.key)}
              disabled={isSubmitting}
            >
              {reaction.label}
            </button>
          ))}
        </div>

        {reactionError ? (
          <div className="card-actions__status card-actions__status--error" role="alert">
            Failed to submit reaction: {reactionError}
          </div>
        ) : null}

        {lastReaction ? (
          <div className="card-actions__status" aria-live="polite">
            Recorded {reactionLabelMap[lastReaction.reaction]} for "{lastReaction.title}"
          </div>
        ) : null}
      </>
    </AsyncBoundary>
  );
}
