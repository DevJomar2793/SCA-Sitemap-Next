"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createSitemapPage,
  deleteSitemapPage,
  getSitemapPage,
  listSitemapPages,
  updateSitemapPage,
} from "../api";
import type { SitemapPage, SitemapPageInput } from "../types";

export function useSitemapPages() {
  const [pages, setPages] = useState<SitemapPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const fetchPages = useCallback(async (signal?: AbortSignal) => {
    try {
      const records = await listSitemapPages(signal);
      setPages(records);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load sitemap pages.",
      );
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  const loadPages = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    await fetchPages();
  }, [fetchPages]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => fetchPages(controller.signal));
    return () => controller.abort();
  }, [fetchPages]);

  async function createPage(values: SitemapPageInput): Promise<SitemapPage> {
    const created = await createSitemapPage(values);
    setPages((current) => [...current, created].sort((a, b) => a.id - b.id));
    return created;
  }

  async function updatePage(
    id: number,
    values: SitemapPageInput,
  ): Promise<SitemapPage> {
    const updated = await updateSitemapPage(id, values);
    setPages((current) =>
      current.map((page) => (page.id === updated.id ? updated : page)),
    );
    return updated;
  }

  async function removePage(id: number): Promise<void> {
    await deleteSitemapPage(id);
    setPages((current) => current.filter((page) => page.id !== id));
  }

  return {
    pages,
    isLoading,
    loadError,
    loadPages,
    getPage: getSitemapPage,
    createPage,
    updatePage,
    removePage,
  };
}
