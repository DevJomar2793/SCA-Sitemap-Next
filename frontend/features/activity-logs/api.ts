import { requestJson } from "@/lib/api-client";

import type { ActivityLogFilters, ActivityLogPage } from "./types";

function dateBoundary(value: string, endOfRange = false): string | undefined {
  if (!value) {
    return undefined;
  }

  const boundary = new Date(`${value}T00:00:00`);
  if (endOfRange) {
    boundary.setDate(boundary.getDate() + 1);
  }
  return boundary.toISOString();
}

export function listActivityLogs({
  query,
  filters,
  page,
  pageSize,
  signal,
}: {
  query: string;
  filters: ActivityLogFilters;
  page: number;
  pageSize: number;
  signal?: AbortSignal;
}): Promise<ActivityLogPage> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (query.trim()) params.set("q", query.trim());
  if (filters.userId) params.set("user_id", filters.userId);
  if (filters.action) params.set("action", filters.action);
  if (filters.module) params.set("module", filters.module);

  const dateFrom = dateBoundary(filters.dateFrom);
  const dateTo = dateBoundary(filters.dateTo, true);
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);

  return requestJson<ActivityLogPage>(`/activity-logs?${params}`, { signal });
}
