import { useCallback, useEffect, useState } from "react";
import type { NewsItem } from "../types/news";

const DEFAULT_NEWS_ENDPOINT = "/api/news";

export function useNewsFeed(endpoint?: string) {
  // If you want to switch the URL depending on the environment, register VITE_NEWS_ENDPOINT in the .env file.
  const targetEndpoint = endpoint ?? import.meta.env.VITE_NEWS_ENDPOINT ?? DEFAULT_NEWS_ENDPOINT;
  const [items, setItems] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(targetEndpoint);
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data: NewsItem[] = await response.json();
      setItems(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [targetEndpoint]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return {
    items,
    error,
    isLoading,
    refresh: fetchNews,
  } as const;
}
