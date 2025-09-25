import { useCallback, useEffect, useState } from "react";

import { AsyncBoundary } from "../../components/AsyncBoundary";
import { LikedArticleCard } from "../../components/LikedArticleCard";
import { useArticleReaction } from "../../hooks/useArticleReaction";
import { useNewsFeed } from "../../hooks/useNewsFeed";

const LIKES_ENDPOINT = "/api/articles/likes";

type LikesTabProps = {
  isActive: boolean;
  shouldLoad: boolean;
  reloadToken: number;
};

export function LikesTab({ isActive, shouldLoad, reloadToken }: LikesTabProps) {
  const { items, error, isLoading, isRefreshing, hasFetched, refresh, mutateItems } = useNewsFeed(LIKES_ENDPOINT, {
    autoFetch: false,
    cacheKey: LIKES_ENDPOINT,
    cacheTimeMs: 5 * 60 * 1000,
  });

  const {
    submitReaction,
    isSubmitting: isUpdatingReaction,
    error: reactionError,
  } = useArticleReaction();
  const [removingId, setRemovingId] = useState<number | null>(null);

  const handleRemove = useCallback(
    async (articleId: number) => {
      if (isUpdatingReaction || removingId !== null) return;
      setRemovingId(articleId);
      try {
        const succeeded = await submitReaction(articleId, 0);
        if (succeeded) {
          mutateItems((prevItems) => prevItems.filter((item) => item.id !== articleId));
        } else {
          await refresh({ force: true });
        }
      } finally {
        setRemovingId(null);
      }
    },
    [isUpdatingReaction, mutateItems, refresh, removingId, submitReaction]
  );

  useEffect(() => {
    if (!shouldLoad || !isActive) return;
    void refresh();
  }, [shouldLoad, isActive, refresh]);

  useEffect(() => {
    if (!shouldLoad) return;
    if (reloadToken === 0) return;
    void refresh({ force: true });
  }, [reloadToken, shouldLoad, refresh]);

  const showLoading = isLoading && !hasFetched;
  const showEmpty = hasFetched && !items.length && !isRefreshing;

  return (
    <AsyncBoundary
      isLoading={showLoading}
      error={error}
      isEmpty={showEmpty}
      loadingMessage="Loading..."
      emptyMessage="No liked articles yet"
      emptyVariant="inline"
      onRetry={() => {
        void refresh({ force: true });
      }}
    >
      <>
        {reactionError ? (
          <div className="card-actions__status card-actions__status--error" role="alert">
            Failed to update reaction: {reactionError}
          </div>
        ) : null}
        <div className="liked-grid">
          {items.map((item) => (
            <LikedArticleCard
              key={item.id}
              item={item}
              onRemove={handleRemove}
              isRemoving={removingId === item.id}
              isDisabled={removingId !== null}
            />
          ))}
        </div>
      </>
    </AsyncBoundary>
  );
}
