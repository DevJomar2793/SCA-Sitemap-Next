import { requestFormData, requestJson } from "@/lib/api-client";

import type {
  SitemapImportResult,
  SitemapPage,
  SitemapPageInput,
} from "./types";

export function listSitemapPages(signal?: AbortSignal): Promise<SitemapPage[]> {
  return requestJson<SitemapPage[]>("/get-admin-pages", { signal });
}

export function getSitemapPage(id: number): Promise<SitemapPage> {
  return requestJson<SitemapPage>(`/get-admin-pages/${id}`);
}

export function searchSitemapPages(query: string): Promise<SitemapPage[]> {
  return requestJson<SitemapPage[]>(
    `/search-sitemap-pages?q=${encodeURIComponent(query)}`,
  );
}

export function createSitemapPage(
  payload: SitemapPageInput,
): Promise<SitemapPage> {
  return requestJson<SitemapPage>("/add-admin-page", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSitemapPage(
  id: number,
  payload: SitemapPageInput,
): Promise<SitemapPage> {
  return requestJson<SitemapPage>(`/update-admin-page/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteSitemapPage(id: number): Promise<void> {
  return requestJson<void>(`/delete-admin-page/${id}`, {
    method: "DELETE",
  });
}

export async function importSitemapWorkbook(
  file: File,
): Promise<SitemapImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  return requestFormData<SitemapImportResult>("/import-sitemap-pages", formData);
}
