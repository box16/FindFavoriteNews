import "./App.css";
import { useEffect, useState } from "react";

type NewsItem = {
  title: string;
  link: string;
  summary: string;
  source: string;
};

const MAX_VISIBLE_STACK = 4;
const MAX_STACK_DEPTH = MAX_VISIBLE_STACK - 1;

const classNames = (...names: Array<string | false | undefined>) =>
  names.filter((name): name is string => Boolean(name)).join(" ");

type NewsCardProps = {
  item: NewsItem;
  stackIndex: number;
};

function NewsCard({ item, stackIndex }: NewsCardProps) {
  const depth = Math.min(stackIndex, MAX_STACK_DEPTH);
  const cardClassName = classNames(
    "news-card",
    `news-card--depth-${depth}`,
    stackIndex === 0 && "news-card--top"
  );

  return (
    <article className={cardClassName}>
      <a href={item.link} target="_blank" rel="noreferrer" className="news-card__title">
        {item.title}
      </a>
      <div className="news-card__source">{item.source}</div>
      <p
        className="news-card__summary"
        dangerouslySetInnerHTML={{ __html: item.summary }}
      />
    </article>
  );
}

export default function App() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/api/news"); // FastAPI
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data: NewsItem[] = await response.json();
        setItems(data);
        setCurrentIndex(0);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "failed";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  const handleRate = () => {
    setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, items.length));
  };

  if (error) return <div className="app-status">エラー: {error}</div>;
  if (isLoading) return <div className="app-status">読み込み中...</div>;

  const remainingItems = items.slice(currentIndex);
  const visibleStack = remainingItems.slice(0, MAX_VISIBLE_STACK);

  return (
    <div className="app">
      <h1 className="app__title">最新ニュース</h1>

      {remainingItems.length ? (
        <>
          <div className="news-stack">
            {visibleStack.map((item, stackIndex) => (
              <NewsCard
                key={`${item.link}-${currentIndex + stackIndex}`}
                item={item}
                stackIndex={stackIndex}
              />
            ))}
          </div>

          <div className="card-actions">
            <button
              type="button"
              className="card-button card-button--like"
              onClick={handleRate}
            >
              Like
            </button>
            <button
              type="button"
              className="card-button card-button--nop"
              onClick={handleRate}
            >
              nop
            </button>
          </div>
        </>
      ) : (
        <div className="app-status app-status--inline">
          すべてのニュースを評価しました
        </div>
      )}
    </div>
  );
}
