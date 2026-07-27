"use client";

import {
  Eye,
  FileQuestion,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import type { SitemapPage } from "../types";

export type SitemapRowAction = "view" | "edit" | "delete";

type SitemapTableProps = {
  pages: SitemapPage[];
  isLoading: boolean;
  startIndex: number;
  activeMenuId: number | null;
  hasFilters: boolean;
  onToggleMenu: (id: number) => void;
  onAction: (action: SitemapRowAction, page: SitemapPage) => void;
  onAdd: () => void;
};

function PlainText({ children }: { children: string }) {
  return (
    <span
      className="block max-w-[180px] truncate font-medium text-slate-700"
      title={children}
    >
      {children}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex max-w-[130px] truncate rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
      {type}
    </span>
  );
}

function ActionMenu({
  page,
  isOpen,
  onToggle,
  onAction,
}: {
  page: SitemapPage;
  isOpen: boolean;
  onToggle: () => void;
  onAction: (action: SitemapRowAction, page: SitemapPage) => void;
}) {
  return (
    <div className="relative" data-popover>
      <button
        type="button"
        onClick={onToggle}
        className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label={`Actions for ${page.screen_label}`}
        aria-expanded={isOpen}
      >
        <MoreVertical className="size-5" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-10 z-30 w-40 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl">
          <button
            type="button"
            onClick={() => onAction("view", page)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Eye className="size-4 text-slate-500" />
            View details
          </button>
          <button
            type="button"
            onClick={() => onAction("edit", page)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Pencil className="size-4 text-slate-500" />
            Edit page
          </button>
          <div className="my-1 h-px bg-slate-100" />
          <button
            type="button"
            onClick={() => onAction("delete", page)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="size-4" />
            Delete page
          </button>
        </div>
      ) : null}
    </div>
  );
}

function LoadingRows() {
  return Array.from({ length: 6 }, (_, index) => (
    <tr key={index} className="border-t border-slate-200">
      <td className="px-5 py-5">
        <div className="h-4 w-5 animate-pulse rounded bg-slate-200" />
      </td>
      <td className="px-5 py-5">
        <div className="h-4 w-12 animate-pulse rounded bg-slate-200" />
      </td>
      <td className="px-5 py-5">
        <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
      </td>
      {Array.from({ length: 4 }, (_, cell) => (
        <td key={cell} className="px-5 py-5">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        </td>
      ))}
      <td className="px-5 py-5">
        <div className="size-7 animate-pulse rounded bg-slate-200" />
      </td>
    </tr>
  ));
}

function EmptyState({
  hasFilters,
  onAdd,
}: {
  hasFilters: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex min-h-[370px] flex-col items-center justify-center px-6 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
        <FileQuestion className="size-7" />
      </div>
      <h3 className="mt-4 text-base font-bold text-slate-900">
        {hasFilters ? "No matching sitemap pages" : "No sitemap pages yet"}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">
        {hasFilters
          ? "Try changing your search or clearing the active filters."
          : "Create your first sitemap record to start building the page index."}
      </p>
      {!hasFilters ? (
        <button
          type="button"
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus className="size-4" />
          Add Page
        </button>
      ) : null}
    </div>
  );
}

export function SitemapTable({
  pages,
  isLoading,
  startIndex,
  activeMenuId,
  hasFilters,
  onToggleMenu,
  onAction,
  onAdd,
}: SitemapTableProps) {
  if (!isLoading && pages.length === 0) {
    return <EmptyState hasFilters={hasFilters} onAdd={onAdd} />;
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[1120px] border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/85 text-xs font-bold uppercase tracking-[0.04em] text-slate-500">
              <th className="w-14 px-5 py-4">#</th>
              <th className="w-24 px-5 py-4">Alpha</th>
              <th className="w-28 px-5 py-4">Screen #</th>
              <th className="min-w-[210px] px-5 py-4">Screen Label</th>
              <th className="min-w-[260px] px-5 py-4">Screen Description</th>
              <th className="min-w-[150px] px-5 py-4">Notes</th>
              <th className="min-w-[250px] px-5 py-4">How to Access</th>
              <th className="w-20 px-5 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700">
            {isLoading ? (
              <LoadingRows />
            ) : (
              pages.map((page, index) => (
                <tr
                  key={page.id}
                  className="border-t border-slate-200 transition hover:bg-blue-50/25"
                >
                  <td className="px-5 py-[18px] font-semibold text-slate-500">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-5 py-[18px] font-bold text-slate-900">
                    {page.alpha}
                  </td>
                  <td className="px-5 py-[18px] font-semibold text-blue-700">
                    {page.screen_number}
                  </td>
                  <td className="px-5 py-[18px]">
                    <p
                      className="max-w-[230px] truncate font-bold text-slate-900"
                      title={page.screen_label}
                    >
                      {page.screen_label}
                    </p>
                    <p
                      className="mt-1 max-w-[230px] truncate text-xs text-slate-500"
                      title={page.file_label}
                    >
                      {page.file_label}
                    </p>
                  </td>
                  <td className="px-5 py-[18px]">
                    <p
                      className="max-w-[300px] truncate font-medium text-slate-700"
                      title={page.screen_description}
                    >
                      {page.screen_description}
                    </p>
                  </td>
                  <td className="px-5 py-[18px]">
                    <PlainText>{page.notes}</PlainText>
                  </td>
                  <td className="px-5 py-[18px]">
                    <p
                      className="max-w-[300px] whitespace-normal break-words font-medium leading-5 text-slate-700"
                      title={page.page_location}
                    >
                      {page.page_location}
                    </p>
                  </td>
                  <td className="px-5 py-[18px]">
                    <div className="flex justify-center">
                      <ActionMenu
                        page={page}
                        isOpen={activeMenuId === page.id}
                        onToggle={() => onToggleMenu(page.id)}
                        onAction={onAction}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 sm:p-4 lg:hidden">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-2xl border border-slate-200 bg-slate-50"
              />
            ))
          : pages.map((page, index) => (
              <article
                key={page.id}
                className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                    {startIndex + index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-slate-950">
                      {page.screen_label}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                      {page.screen_description}
                    </p>
                  </div>
                  <ActionMenu
                    page={page}
                    isOpen={activeMenuId === page.id}
                    onToggle={() => onToggleMenu(page.id)}
                    onAction={onAction}
                  />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-4 text-xs">
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-slate-400">
                      Reference
                    </dt>
                    <dd className="mt-1 font-semibold text-blue-700">
                      {page.alpha}-{page.screen_number} · {page.file_label}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-slate-400">
                      Type
                    </dt>
                    <dd className="mt-1">
                      <TypeBadge type={page.screen_type} />
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-slate-400">
                      How to Access
                    </dt>
                    <dd className="mt-1 break-words font-medium leading-5 text-slate-700">
                      {page.page_location}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-slate-400">
                      Notes
                    </dt>
                    <dd className="mt-1">
                      <PlainText>{page.notes}</PlainText>
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
      </div>
    </>
  );
}
