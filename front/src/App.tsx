import "./App.css";
import { useEffect, useState } from "react";
import { NewsCard } from "./components/NewsCard";
import { SanitizedHtml } from "./components/SanitizedHtml";
import { useNewsFeed } from "./hooks/useNewsFeed";

const MAX_VISIBLE_STACK = 4;
const MAX_STACK_DEPTH = MAX_VISIBLE_STACK - 1;

// It allows the type to capture that the values are fixed string literals 'Like' | 'nop'.
const reactionLabels = {
  like: "Like",
  skip: "nop",
} as const;
type Reaction = keyof typeof reactionLabels;

export default function App() {
  const { items, error, isLoading } = useNewsFeed();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastReaction, setLastReaction] = useState<{
    title: string;
    reaction: Reaction;
  } | null>(null);

  useEffect(() => {
    setCurrentIndex(0);
    setLastReaction(null);
  }, [items]);

  if (error) return <div className="app-status">エラー: {error}</div>;
  if (isLoading) return <div className="app-status">読み込み中...</div>;

  const remainingItems = items.slice(currentIndex);
  const visibleStack = remainingItems.slice(0, MAX_VISIBLE_STACK);

  const handleRate = (reaction: Reaction) => {
    const ratedItem = items[currentIndex];

    if (ratedItem) {
      setLastReaction({ title: ratedItem.title, reaction });
    }

    setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, items.length));
  };

  return (
    <div className="app">
      <h1 className="app__title">最新ニュース</h1>

      {remainingItems.length ? (
        <>
          <div className="news-stack">
            {visibleStack.map((item, stackIndex) => (
              <NewsCard
                key={`${item.link}-${currentIndex + stackIndex}`}
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
            >
              Like
            </button>
            <button
              type="button"
              className="card-button card-button--nop"
              onClick={() => handleRate("skip")}
            >
              nop
            </button>
          </div>

          {lastReaction ? (
            <div className="card-actions__status" aria-live="polite">
              {lastReaction.title} を {reactionLabels[lastReaction.reaction]} しました
            </div>
          ) : null}
        </>
      ) : (
        <div className="app-status app-status--inline">
          すべてのニュースを評価しました
        </div>
      )}
    </div>
  );
}
