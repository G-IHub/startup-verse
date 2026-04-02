/**
 * Reusable pagination hook for frontend components
 * Manages page state, loading, and data fetching
 * Updated for Phase 4 - works with new paginated API functions
 */

import { useState, useCallback, useEffect } from "react";

export function usePagination({
  fetchFn,
  initialPageSize = 50,
  autoFetch = true,
  onError,
}) {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: initialPageSize,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFiltersState] = useState({});

  const fetchData = useCallback(
    async (params) => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchFn(params);

        // Handle different response formats
        const items =
          result.items ||
          result.tasks ||
          result.talents ||
          result.opportunities ||
          [];
        const paginationData = result.pagination;

        setData(items);
        setPagination({
          page: paginationData.page,
          pageSize: paginationData.pageSize,
          total: paginationData.total,
          totalPages: paginationData.totalPages,
          hasNext: paginationData.hasNext,
          hasPrev: paginationData.hasPrev,
        });
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to fetch data");
        setError(error);
        if (onError) {
          onError(error);
        }
      } finally {
        setLoading(false);
      }
    },
    [fetchFn, onError],
  );

  const goToPage = useCallback(
    (page) => {
      if (page >= 1 && page <= pagination.totalPages) {
        fetchData({
          page,
          pageSize: pagination.pageSize,
          search: searchQuery,
          filters,
        });
      }
    },
    [
      fetchData,
      pagination.pageSize,
      pagination.totalPages,
      searchQuery,
      filters,
    ],
  );

  const nextPage = useCallback(() => {
    if (pagination.hasNext) {
      goToPage(pagination.page + 1);
    }
  }, [goToPage, pagination.hasNext, pagination.page]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrev) {
      goToPage(pagination.page - 1);
    }
  }, [goToPage, pagination.hasPrev, pagination.page]);

  const setPageSize = useCallback(
    (size) => {
      setPagination((prev) => ({ ...prev, pageSize: size, page: 1 }));
      fetchData({
        page: 1,
        pageSize: size,
        search: searchQuery,
        filters,
      });
    },
    [fetchData, searchQuery, filters],
  );

  const setSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      fetchData({
        page: 1,
        pageSize: pagination.pageSize,
        search: query,
        filters,
      });
    },
    [fetchData, pagination.pageSize, filters],
  );

  const setFilters = useCallback(
    (newFilters) => {
      setFiltersState(newFilters);
      fetchData({
        page: 1,
        pageSize: pagination.pageSize,
        search: searchQuery,
        filters: newFilters,
      });
    },
    [fetchData, pagination.pageSize, searchQuery],
  );

  const refresh = useCallback(() => {
    fetchData({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: searchQuery,
      filters,
    });
  }, [fetchData, pagination.page, pagination.pageSize, searchQuery, filters]);

  // Initial load (only if autoFetch is true)
  useEffect(() => {
    if (autoFetch) {
      fetchData({
        page: 1,
        pageSize: initialPageSize,
        search: "",
        filters: {},
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return {
    data,
    pagination,
    loading,
    error,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    setSearch,
    setFilters,
    refresh,
  };
}
