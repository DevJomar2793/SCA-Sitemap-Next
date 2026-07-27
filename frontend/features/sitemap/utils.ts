import type { SitemapPage } from "./types";

export type PaginationItem = number | "ellipsis";

export function getPaginationItems(
  currentPage: number,
  pageCount: number,
): PaginationItem[] {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const items: PaginationItem[] = [1];
  const rangeStart = Math.max(2, currentPage - 1);
  const rangeEnd = Math.min(pageCount - 1, currentPage + 1);

  if (rangeStart > 2) {
    items.push("ellipsis");
  }

  for (let page = rangeStart; page <= rangeEnd; page += 1) {
    items.push(page);
  }

  if (rangeEnd < pageCount - 1) {
    items.push("ellipsis");
  }

  items.push(pageCount);
  return items;
}

function escapeCsv(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function downloadSitemapCsv(pages: SitemapPage[]): void {
  const headers = [
    "ID",
    "Alpha",
    "Screen Number",
    "Screen Type",
    "Screen Description",
    "File Label",
    "Screen Label",
    "Notes",
    "Navigation Instructions",
    "Created At",
    "Updated At",
  ];
  const rows = pages.map((page) => [
    page.id,
    page.alpha,
    page.screen_number,
    page.screen_type,
    page.screen_description,
    page.file_label,
    page.screen_label,
    page.notes,
    page.page_location,
    page.created_at,
    page.updated_at,
  ]);
  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `sitemap-pages-${date}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
