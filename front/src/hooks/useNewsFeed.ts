import { useCallback, useEffect, useState } from "react";

import { getJson } from "../utils/apiClient";
import type { NewsItem } from "../types/news";

const DEFAULT_NEWS_ENDPOINT = "/api/news";

export function useNewsFeed(endpoint?: string) {
  // If you want to switch the URL depending on the environment, register VITE_NEWS_ENDPOINT in the .env file.
  const targetEndpoint = endpoint ?? import.meta.env.VITE_NEWS_ENDPOINT ?? DEFAULT_NEWS_ENDPOINT;
  const [items, setItems] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchNews = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError("");

      try {
        const data = await getJson<NewsItem[]>(targetEndpoint, { signal });
        setItems(data);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const message = err instanceof Error ? err.message : "failed";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [targetEndpoint]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchNews(controller.signal);
    return () => controller.abort();
  }, [fetchNews]);

  return {
    items,
    error,
    isLoading,
    refresh: () => fetchNews(),
  } as const;
}
