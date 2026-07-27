"use client";

import { useMemo, useState } from "react";

import {
  EMPTY_SITEMAP_FILTERS,
  type SitemapFilters,
  type SitemapPage,
  type SitemapPageInput,
} from "../types";
import { getPaginationItems } from "../utils";

const SEARCH_FIELDS: Array<keyof SitemapPageInput> = [
  "alpha",
  "screen_number",
  "screen_type",
  "screen_description",
  "file_label",
  "screen_label",
  "notes",
  "page_location",
];

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function useSitemapTableState(pages: SitemapPage[]) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SitemapFilters>(
    EMPTY_SITEMAP_FILTERS,
  );
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filterOptions = useMemo(
    () => ({
      alphas: uniqueSorted(pages.map((page) => page.alpha)),
      screenTypes: uniqueSorted(pages.map((page) => page.screen_type)),
      notes: uniqueSorted(pages.map((page) => page.notes)),
    }),
    [pages],
  );

  const filteredPages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return pages.filter((page) => {
      const matchesQuery =
        !normalizedQuery ||
        SEARCH_FIELDS.some((field) =>
          page[field].toLowerCase().includes(normalizedQuery),
        );
      const matchesAlpha = !filters.alpha || page.alpha === filters.alpha;
      const matchesType =
        !filters.screenType || page.screen_type === filters.screenType;
      const matchesNotes = !filters.notes || page.notes === filters.notes;

      return matchesQuery && matchesAlpha && matchesType && matchesNotes;
    });
  }, [filters, pages, query]);

  const pageCount = Math.max(1, Math.ceil(filteredPages.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const visiblePages = filteredPages.slice(startIndex, startIndex + pageSize);
  const activeFilterCount = [
    filters.alpha,
    filters.screenType,
    filters.notes,
  ].filter(Boolean).length;
  const hasFilters =
    Boolean(query.trim()) ||
    Boolean(filters.alpha || filters.screenType || filters.notes);

  function changeQuery(value: string) {
    setQuery(value);
    setCurrentPage(1);
  }

  function updateFilter(name: keyof SitemapFilters, value: string) {
    setFilters((current) => ({ ...current, [name]: value }));
    setCurrentPage(1);
  }

  function clearFilters() {
    setFilters(EMPTY_SITEMAP_FILTERS);
    setQuery("");
    setCurrentPage(1);
  }

  function changePageSize(value: number) {
    setPageSize(value);
    setCurrentPage(1);
  }

  return {
    query,
    changeQuery,
    filters,
    updateFilter,
    clearFilters,
    filterOptions,
    filteredPages,
    visiblePages,
    pageSize,
    changePageSize,
    currentPage: safeCurrentPage,
    setCurrentPage,
    pageCount,
    startIndex,
    activeFilterCount,
    hasFilters,
    paginationItems: getPaginationItems(safeCurrentPage, pageCount),
  };
}
