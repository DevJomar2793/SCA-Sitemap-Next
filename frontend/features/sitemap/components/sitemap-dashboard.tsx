"use client";

import { AlertCircle, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Sidebar } from "@/components/layout/sidebar";

import { useSitemapPages } from "../hooks/use-sitemap-pages";
import { useSitemapTableState } from "../hooks/use-sitemap-table-state";
import { useToast } from "../hooks/use-toast";
import type {
  SitemapFormMode,
  SitemapPage,
  SitemapPageInput,
} from "../types";
import { downloadSitemapCsv } from "../utils";
import { DeleteSitemapDialog } from "./delete-sitemap-dialog";
import { NotificationToast } from "./notification-toast";
import { SitemapHeader } from "./sitemap-header";
import { SitemapPageModal } from "./sitemap-page-modal";
import { SitemapPagination } from "./sitemap-pagination";
import {
  SitemapTable,
  type SitemapRowAction,
} from "./sitemap-table";
import { SitemapToolbar } from "./sitemap-toolbar";

type ModalState = {
  mode: SitemapFormMode;
  page?: SitemapPage;
};

export function SitemapDashboard() {
  const {
    pages,
    isLoading,
    loadError,
    loadPages,
    getPage,
    createPage,
    updatePage,
    removePage,
  } = useSitemapPages();
  const table = useSitemapTableState(pages);
  const { toast, isClosing, showToast, dismissToast } = useToast();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [loadingRecordId, setLoadingRecordId] = useState<number | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SitemapPage | null>(null);

  useEffect(() => {
    function closePopovers(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-popover]")) {
        return;
      }
      setActiveMenuId(null);
      setIsFilterOpen(false);
    }

    document.addEventListener("mousedown", closePopovers);
    return () => document.removeEventListener("mousedown", closePopovers);
  }, []);

  async function openRecord(mode: "view" | "edit", id: number) {
    setActiveMenuId(null);
    setLoadingRecordId(id);

    try {
      const record = await getPage(id);
      setModal({ mode, page: record });
    } catch (error) {
      showToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Unable to load this page.",
      });
    } finally {
      setLoadingRecordId(null);
    }
  }

  function handleRowAction(action: SitemapRowAction, page: SitemapPage) {
    setActiveMenuId(null);

    if (action === "delete") {
      setDeleteTarget(page);
      return;
    }

    void openRecord(action, page.id);
  }

  async function submitModal(values: SitemapPageInput) {
    if (!modal) {
      return;
    }

    if (modal.mode === "create") {
      await createPage(values);
      showToast({
        type: "success",
        message: "Sitemap page added successfully.",
      });
      return;
    }

    if (modal.mode === "edit" && modal.page) {
      await updatePage(modal.page.id, values);
      showToast({
        type: "success",
        message: "Sitemap page updated successfully.",
      });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    await removePage(deleteTarget.id);
    showToast({
      type: "success",
      message: "Sitemap page deleted successfully.",
    });
  }

  function exportPages() {
    downloadSitemapCsv(table.filteredPages);
    showToast({
      type: "success",
      message: `${table.filteredPages.length} page${
        table.filteredPages.length === 1 ? "" : "s"
      } exported.`,
    });
  }

  function clearFilters() {
    table.clearFilters();
    setIsFilterOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="min-h-screen lg:ml-[270px]">
        <SitemapHeader onOpenSidebar={() => setIsSidebarOpen(true)} />

        <div className="mx-auto max-w-[1800px] px-4 py-6 sm:px-7 lg:px-9 lg:py-7">
          <SitemapToolbar
            query={table.query}
            onQueryChange={table.changeQuery}
            filters={table.filters}
            filterOptions={table.filterOptions}
            activeFilterCount={table.activeFilterCount}
            isFilterOpen={isFilterOpen}
            onToggleFilter={() => setIsFilterOpen((open) => !open)}
            onUpdateFilter={table.updateFilter}
            onClearFilters={clearFilters}
            onExport={exportPages}
            isExportDisabled={table.filteredPages.length === 0}
            onAdd={() => setModal({ mode: "create" })}
          />

          {loadError ? (
            <LoadError message={loadError} onRetry={() => void loadPages()} />
          ) : null}

          {loadingRecordId ? (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
              <RotateCw className="size-4 animate-spin" />
              Loading page details...
            </div>
          ) : null}

          <section
            aria-label="Sitemap page records"
            className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <SitemapTable
              pages={table.visiblePages}
              isLoading={isLoading}
              startIndex={table.startIndex}
              activeMenuId={activeMenuId}
              hasFilters={table.hasFilters}
              onToggleMenu={(id) =>
                setActiveMenuId((current) => (current === id ? null : id))
              }
              onAction={handleRowAction}
              onAdd={() => setModal({ mode: "create" })}
            />

            {!isLoading ? (
              <SitemapPagination
                totalEntries={table.filteredPages.length}
                startIndex={table.startIndex}
                pageSize={table.pageSize}
                currentPage={table.currentPage}
                pageCount={table.pageCount}
                paginationItems={table.paginationItems}
                onPageSizeChange={table.changePageSize}
                onPageChange={table.setCurrentPage}
              />
            ) : null}
          </section>
        </div>
      </main>

      {modal ? (
        <SitemapPageModal
          key={`${modal.mode}-${modal.page?.id ?? "new"}`}
          mode={modal.mode}
          page={modal.page}
          onClose={() => setModal(null)}
          onSubmit={submitModal}
        />
      ) : null}

      {deleteTarget ? (
        <DeleteSitemapDialog
          page={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      ) : null}

      {toast ? (
        <NotificationToast
          toast={toast}
          isClosing={isClosing}
          onDismiss={dismissToast}
        />
      ) : null}
    </div>
  );
}

function LoadError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="mt-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <span>
          <strong className="font-semibold">Could not load pages</strong>
          {" — "}
          {message}
        </span>
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 self-start rounded-lg bg-white px-3 py-1.5 font-semibold text-red-700 shadow-sm ring-1 ring-red-200 sm:self-auto"
      >
        <RotateCw className="size-3.5" />
        Retry
      </button>
    </div>
  );
}
