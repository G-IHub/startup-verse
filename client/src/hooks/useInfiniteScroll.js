/**
 * Infinite scroll hook with Intersection Observer
 * Auto-loads next page when user scrolls to bottom
 */

import { useState, useCallback, useEffect, useRef } from "react";

export function useInfiniteScroll({
  fetchFn,
  pageSize = 50,
  threshold = 0.8,
  onError,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(undefined);

  const observer = useRef(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(cursor, pageSize);

      setData((prev) => [...prev, ...result.items]);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to load more data");
      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [cursor, fetchFn, hasMore, loading, onError, pageSize]);

  const refresh = useCallback(async () => {
    setData([]);
    setCursor(undefined);
    setHasMore(true);
    setError(null);

    setLoading(true);
    try {
      const result = await fetchFn(undefined, pageSize);
      setData(result.items);
      setCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to refresh data");
      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, onError, pageSize]);

  const observerRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMore();
          }
        },
        { threshold },
      );

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, loadMore, threshold],
  );

  // Initial load
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    observerRef,
  };
}
