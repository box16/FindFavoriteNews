import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getJson } from "../utils/apiClient";
import type { NewsItem } from "../types/news";

const DEFAULT_NEWS_ENDPOINT = "/api/news";
const DEFAULT_CACHE_TIME_MS = 60 * 1000;

type CacheEntry = {
  items: NewsItem[];
  timestamp: number;
};

type UseNewsFeedOptions = {
  autoFetch?: boolean;
  cacheKey?: string;
  cacheTimeMs?: number;
};

type RefreshOptions = {
  force?: boolean;
};

const feedCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<NewsItem[]>>();

export function useNewsFeed(endpoint?: string, options?: UseNewsFeedOptions) {
  const targetEndpoint = useMemo(() => endpoint ?? import.meta.env.VITE_NEWS_ENDPOINT ?? DEFAULT_NEWS_ENDPOINT, [endpoint]);
  const autoFetch = options?.autoFetch ?? true;
  const cacheKey = options?.cacheKey ?? targetEndpoint;
  const cacheTimeMs = options?.cacheTimeMs ?? DEFAULT_CACHE_TIME_MS;

  const cachedEntry = feedCache.get(cacheKey);

  const [items, setItems] = useState<NewsItem[]>(cachedEntry?.items ?? []);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(autoFetch && !cachedEntry);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasFetched, setHasFetched] = useState(Boolean(cachedEntry));

  const isActiveRef = useRef(true);

  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
    };
  }, [cacheKey]);

  useEffect(() => {
    const newCache = feedCache.get(cacheKey);
    if (newCache) {
      setItems(newCache.items);
      setHasFetched(true);
      setIsLoading(false);
    } else {
      setItems([]);
      setHasFetched(false);
      setIsLoading(autoFetch);
    }
    setError("");
  }, [cacheKey, autoFetch]);

  const performFetch = useCallback(
    async (opts?: RefreshOptions) => {
      const force = opts?.force ?? false;
      const now = Date.now();
      const cached = feedCache.get(cacheKey);
      const isCacheValid = cached ? now - cached.timestamp <= cacheTimeMs : false;

      if (!force && cached && isCacheValid) {
        if (!hasFetched && isActiveRef.current) {
          setItems(cached.items);
          setHasFetched(true);
          setIsLoading(false);
        }
        return cached.items;
      }

      if (hasFetched) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError("");

      const existingRequest = inflightRequests.get(cacheKey);
      const requestPromise = existingRequest
        ?? getJson<NewsItem[]>(targetEndpoint).then((data) => {
          feedCache.set(cacheKey, { items: data, timestamp: Date.now() });
          return data;
        });

      if (!existingRequest) {
        inflightRequests.set(cacheKey, requestPromise);
      }

      try {
        const data = await requestPromise;
        if (!isActiveRef.current) {
          return data;
        }
        setItems(data);
        setError("");
        setHasFetched(true);
        return data;
      } catch (err: unknown) {
        if (!isActiveRef.current) {
          throw err;
        }

        if (!(err instanceof DOMException && err.name === "AbortError")) {
          const message = err instanceof Error ? err.message : "failed";
          setError(message);
        }
        throw err;
      } finally {
        if (!existingRequest) {
          inflightRequests.delete(cacheKey);
        }
        if (isActiveRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [cacheKey, cacheTimeMs, hasFetched, targetEndpoint]
  );

  useEffect(() => {
    if (!autoFetch) {
      return;
    }
    void performFetch();
  }, [autoFetch, performFetch]);

  const refresh = useCallback(
    async (opts?: RefreshOptions) => {
      try {
        return await performFetch(opts);
      } catch {
        return [];
      }
    },
    [performFetch]
  );

  return {
    items,
    error,
    isLoading,
    isRefreshing,
    hasFetched,
    refresh,
  } as const;
}
