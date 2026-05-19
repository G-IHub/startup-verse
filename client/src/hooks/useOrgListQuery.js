import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "./useDebouncedValue.js";

/**
 * Server-backed list state for Step 3.1 (`skip`/`limit` APIs).
 */
export function useOrgListQuery({
  fetchFn,
  initialLimit = 25,
  initialFilters = {},
  initialSortBy,
  initialSortOrder = "desc",
  autoFetch = true,
  debounceMs = 300,
}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimitState] = useState(initialLimit);
  const [skip, setSkip] = useState(0);
  const [q, setQ] = useState("");
  const [filters, setFiltersState] = useState(initialFilters);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedQ = useDebouncedValue(q, debounceMs);

  const queryParams = useMemo(
    () => ({
      q: debouncedQ || undefined,
      limit,
      skip,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
      status: filters.status || undefined,
      ...Object.fromEntries(
        Object.entries(filters).filter(([k, v]) => k !== "status" && v != null && v !== ""),
      ),
    }),
    [debouncedQ, limit, skip, sortBy, sortOrder, filters],
  );

  const fetchPage = useCallback(
    async (overrides = {}) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchFn({ ...queryParams, ...overrides });
        setItems(result.items || []);
        setTotal(typeof result.total === "number" ? result.total : 0);
        if (typeof result.limit === "number") setLimitState(result.limit);
        if (typeof result.skip === "number") setSkip(result.skip);
        return result;
      } catch (err) {
        const e = err instanceof Error ? err : new Error("Failed to fetch list");
        setError(e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, queryParams],
  );

  useEffect(() => {
    if (!autoFetch) return;
    fetchPage().catch(() => {});
  }, [debouncedQ, limit, skip, sortBy, sortOrder, filters, autoFetch, fetchPage]);

  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  const currentPage = Math.floor(skip / limit) + 1;

  const goToPage = useCallback(
    (page) => {
      const next = Math.max(1, Math.min(page, totalPages));
      setSkip((next - 1) * limit);
    },
    [limit, totalPages],
  );

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) goToPage(currentPage + 1);
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const setSearch = useCallback((value) => {
    setQ(value);
    setSkip(0);
  }, []);

  const setFilters = useCallback((next) => {
    setFiltersState(next);
    setSkip(0);
  }, []);

  const setPageSize = useCallback((size) => {
    setLimitState(size);
    setSkip(0);
  }, []);

  const refresh = useCallback(() => fetchPage(), [fetchPage]);

  return {
    items,
    total,
    limit,
    skip,
    q,
    setSearch,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    loading,
    error,
    currentPage,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    refresh,
    fetchPage,
  };
}
