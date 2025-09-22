import "./App.css";
import { useEffect, useMemo, useState } from "react";
import { NewsCard } from "./components/NewsCard";
import { SanitizedHtml } from "./components/SanitizedHtml";
import { useNewsFeed } from "./hooks/useNewsFeed";

const MAX_VISIBLE_STACK = 4;
const MAX_STACK_DEPTH = MAX_VISIBLE_STACK - 1;
const MAX_FEED_ITEMS = 30;

// It allows the type to capture that the values are fixed string literals 'Like' | 'nop'.
const reactionLabels = {
  like: "Like",
  skip: "nop",
} as const;
const reactionValues = {
  like: 1,
  skip: -1,
} as const;
type Reaction = keyof typeof reactionLabels;

export default function App() {
  const { items, error, isLoading } = useNewsFeed();
  const cappedItems = useMemo(() => items.slice(0, MAX_FEED_ITEMS), [items]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastReaction, setLastReaction] = useState<{
    title: string;
    reaction: Reaction;
  } | null>(null);
  const [reactionError, setReactionError] = useState("");
  const [isSubmittingReaction, setIsSubmittingReaction] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setLastReaction(null);
    setReactionError("");
  }, [cappedItems]);

  if (error) return <div className="app-status">エラー: {error}</div>;
  if (isLoading) return <div className="app-status">読み込み中...</div>;

  const remainingItems = cappedItems.slice(currentIndex);
  const visibleStack = remainingItems.slice(0, MAX_VISIBLE_STACK);

  const handleRate = async (reaction: Reaction) => {
    const ratedItem = cappedItems[currentIndex];
    if (!ratedItem || isSubmittingReaction) return;

    setReactionError("");
    setIsSubmittingReaction(true);

    try {
      const response = await fetch(`/api/articles/${ratedItem.id}/reaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: reactionValues[reaction] }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      setLastReaction({ title: ratedItem.title, reaction });
      setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, cappedItems.length));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "failed";
      setReactionError(message);
    } finally {
      setIsSubmittingReaction(false);
    }
  };

  return (
    <div className="app">
      <h1 className="app__title">最新ニュース</h1>

      {remainingItems.length ? (
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
                <SanitizedHtml
                  html={item.summary}
                  className="news-card__summary"
                  as="p"
                />
              </NewsCard>
            ))}
          </div>

          <div className="card-actions">
            <button
              type="button"
              className="card-button card-button--like"
              onClick={() => handleRate("like")}
              disabled={isSubmittingReaction}
            >
              Like
            </button>
            <button
              type="button"
              className="card-button card-button--nop"
              onClick={() => handleRate("skip")}
              disabled={isSubmittingReaction}
            >
              nop
            </button>
          </div>

          {reactionError ? (
            <div className="card-actions__status card-actions__status--error" role="alert">
              リアクションの送信に失敗しました: {reactionError}
            </div>
          ) : null}

          {lastReaction ? (
            <div className="card-actions__status" aria-live="polite">
              {lastReaction.title} を {reactionLabels[lastReaction.reaction]} しました
            </div>
          ) : null}
        </>
      ) : (
        <div className="app-status app-status--inline">
          すべてのニュースをチェックしました
        </div>
      )}
    </div>
  );
}
