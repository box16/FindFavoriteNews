import { useEffect } from "react";

import { AsyncBoundary } from "../../components/AsyncBoundary";
import { LikedArticleCard } from "../../components/LikedArticleCard";
import { useNewsFeed } from "../../hooks/useNewsFeed";

const LIKES_ENDPOINT = "/api/articles/likes";

type LikesTabProps = {
  isActive: boolean;
  shouldLoad: boolean;
  reloadToken: number;
};

export function LikesTab({ isActive, shouldLoad, reloadToken }: LikesTabProps) {
  const { items, error, isLoading, isRefreshing, hasFetched, refresh } = useNewsFeed(LIKES_ENDPOINT, {
    autoFetch: false,
    cacheKey: LIKES_ENDPOINT,
    cacheTimeMs: 5 * 60 * 1000,
  });

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
      <div className="liked-grid">
        {items.map((item) => (
          <LikedArticleCard key={item.id} item={item} />
        ))}
      </div>
    </AsyncBoundary>
  );
}
