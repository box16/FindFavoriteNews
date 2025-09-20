import "./App.css";
import { useEffect, useState } from "react";

type NewsItem = {
  title: string;
  link: string;
  summary: string;
  source: string;
};

export default function App() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/api/news"); // FastAPI
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const data: NewsItem[] = await response.json();
        setItems(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "failed";
        setError(message);
      }
    };

    fetchNews();
  }, []);

  if (error) return <div className="app-status">エラー: {error}</div>;
  if (!items.length) return <div className="app-status">読み込み中...</div>;

  return (
    <div className="app">
      <h1 className="app__title">最新ニュース</h1>
      <ul className="news-list">
        {items.map((item, index) => (
          <li key={index} className="news-list__item">
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="news-list__link"
            >
              {item.title}
            </a>
            <div className="news-list__source">{item.source}</div>
            <p
              className="news-list__summary"
              dangerouslySetInnerHTML={{ __html: item.summary }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
