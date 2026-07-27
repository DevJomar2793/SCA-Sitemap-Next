"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import type { PaginationItem } from "../utils";

type SitemapPaginationProps = {
  totalEntries: number;
  startIndex: number;
  pageSize: number;
  currentPage: number;
  pageCount: number;
  paginationItems: PaginationItem[];
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
};

export function SitemapPagination({
  totalEntries,
  startIndex,
  pageSize,
  currentPage,
  pageCount,
  paginationItems,
  onPageSizeChange,
  onPageChange,
}: SitemapPaginationProps) {
  if (totalEntries === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
      <p className="text-sm font-medium text-slate-600">
        Showing{" "}
        <strong className="font-semibold text-slate-900">
          {startIndex + 1}
        </strong>{" "}
        to{" "}
        <strong className="font-semibold text-slate-900">
          {Math.min(startIndex + pageSize, totalEntries)}
        </strong>{" "}
        of{" "}
        <strong className="font-semibold text-slate-900">{totalEntries}</strong>{" "}
        {totalEntries === 1 ? "entry" : "entries"}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative">
          <span className="sr-only">Rows per page</span>
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-10 rounded-xl border border-slate-300 bg-white pl-3 pr-8 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="grid size-10 place-items-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          {paginationItems.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="grid size-10 place-items-center text-sm font-semibold text-slate-400"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                className={`grid size-10 place-items-center rounded-xl border text-sm font-semibold transition ${
                  item === currentPage
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                aria-current={item === currentPage ? "page" : undefined}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <span className="px-2 text-sm font-semibold text-slate-600 sm:hidden">
          {currentPage} / {pageCount}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
          disabled={currentPage === pageCount}
          className="grid size-10 place-items-center rounded-xl border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
