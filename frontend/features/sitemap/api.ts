import type {
  SitemapImportResult,
  SitemapPage,
  SitemapPageInput,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000/api/v1";

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object" || !("detail" in payload)) {
    return fallback;
  }

  const detail = payload.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          return String(item.msg);
        }
        return null;
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(". ");
    }
  }

  return fallback;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  return readApiResponse<T>(response);
}

async function readApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    throw new Error(
      getErrorMessage(payload, `Request failed with status ${response.status}`),
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function listSitemapPages(signal?: AbortSignal): Promise<SitemapPage[]> {
  return apiRequest<SitemapPage[]>("/get-admin-pages", { signal });
}

export function getSitemapPage(id: number): Promise<SitemapPage> {
  return apiRequest<SitemapPage>(`/get-admin-pages/${id}`);
}

export function searchSitemapPages(query: string): Promise<SitemapPage[]> {
  return apiRequest<SitemapPage[]>(
    `/search-sitemap-pages?q=${encodeURIComponent(query)}`,
  );
}

export function createSitemapPage(
  payload: SitemapPageInput,
): Promise<SitemapPage> {
  return apiRequest<SitemapPage>("/add-admin-page", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSitemapPage(
  id: number,
  payload: SitemapPageInput,
): Promise<SitemapPage> {
  return apiRequest<SitemapPage>(`/update-admin-page/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteSitemapPage(id: number): Promise<void> {
  return apiRequest<void>(`/delete-admin-page/${id}`, {
    method: "DELETE",
  });
}

export async function importSitemapWorkbook(
  file: File,
): Promise<SitemapImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/import-sitemap-pages`, {
    method: "POST",
    body: formData,
  });
  return readApiResponse<SitemapImportResult>(response);
}
