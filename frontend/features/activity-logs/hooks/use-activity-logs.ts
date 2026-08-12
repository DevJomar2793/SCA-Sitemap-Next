"use client";

import { useCallback, useEffect, useState } from "react";

import { listActivityLogs } from "../api";
import {
  EMPTY_ACTIVITY_FILTERS,
  type ActivityLogFilters,
  type ActivityLogPage,
} from "../types";

const EMPTY_PAGE: ActivityLogPage = {
  items: [],
  total: 0,
  page: 1,
  page_size: 10,
  page_count: 0,
  filter_options: { users: [], modules: [] },
};

export function useActivityLogs() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ActivityLogFilters>(
    EMPTY_ACTIVITY_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<ActivityLogPage>(EMPTY_PAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const load = useCallback(
    async (signal: AbortSignal) => {
      setIsLoading(true);
      setError("");
      try {
        setData(
          await listActivityLogs({
            query,
            filters,
            page,
            pageSize,
            signal,
          }),
        );
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load activity logs.",
        );
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    },
    [filters, page, pageSize, query],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => void load(controller.signal), 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [load, retryCount]);

  function changeQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateFilter(name: keyof ActivityLogFilters, value: string) {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  }

  function clearFilters() {
    setQuery("");
    setFilters(EMPTY_ACTIVITY_FILTERS);
    setPage(1);
  }

  function changePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  return {
    query,
    filters,
    data,
    page,
    pageSize,
    isLoading,
    error,
    hasFilters:
      Boolean(query.trim()) || Object.values(filters).some(Boolean),
    changeQuery,
    updateFilter,
    clearFilters,
    setPage,
    changePageSize,
    retry: () => setRetryCount((count) => count + 1),
  };
}
