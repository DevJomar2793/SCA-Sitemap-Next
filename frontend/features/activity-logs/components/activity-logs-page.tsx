"use client";

import {
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FileClock,
  RotateCw,
  Search,
  X,
} from "lucide-react";
import { Fragment, useState } from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import type { AdminUser } from "@/features/auth/types";
import { SitemapPagination } from "@/features/sitemap/components/sitemap-pagination";
import { getPaginationItems } from "@/features/sitemap/utils";

import { useActivityLogs } from "../hooks/use-activity-logs";
import type {
  ActivityAction,
  ActivityChange,
  ActivityLog,
  ActivityLogFilters,
} from "../types";

const FIELD_LABELS: Record<string, string> = {
  alpha: "Alpha",
  screen_number: "Screen number",
  screen_type: "Screen type",
  screen_description: "Screen description",
  file_label: "File label",
  screen_label: "Screen label",
  notes: "Notes",
  page_location: "Navigation instructions",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
});

const CHANGE_PREVIEW_LIMIT = 2;

export function ActivityLogsPage({ admin }: { admin: AdminUser }) {
  const logs = useActivityLogs();
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  function toggleDetails(id: number) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <AdminShell admin={admin} title="Activity Logs" section="Audit History">
      <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-7 lg:px-9 lg:py-7">
        <div className="mb-6">
          <p className="text-sm font-semibold text-blue-600">System history</p>
          <h2 className="mt-1 text-2xl font-bold tracking-[-0.025em] text-slate-950">
            Review sitemap activity
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-500">
            Search and inspect the read-only record of manual additions,
            updates, and deletions.
          </p>
        </div>

        <ActivityToolbar
          query={logs.query}
          filters={logs.filters}
          users={logs.data.filter_options.users}
          modules={logs.data.filter_options.modules}
          hasFilters={logs.hasFilters}
          onQueryChange={logs.changeQuery}
          onFilterChange={logs.updateFilter}
          onClear={logs.clearFilters}
        />

        {logs.error ? (
          <ActivityError message={logs.error} onRetry={logs.retry} />
        ) : (
          <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {logs.isLoading ? (
              <ActivitySkeleton />
            ) : logs.data.items.length === 0 ? (
              <ActivityEmptyState
                hasFilters={logs.hasFilters}
                onClear={logs.clearFilters}
              />
            ) : (
              <>
                <ActivityTable
                  items={logs.data.items}
                  expandedIds={expandedIds}
                  onToggle={toggleDetails}
                />
                <SitemapPagination
                  totalEntries={logs.data.total}
                  startIndex={(logs.page - 1) * logs.pageSize}
                  pageSize={logs.pageSize}
                  currentPage={logs.page}
                  pageCount={logs.data.page_count}
                  paginationItems={getPaginationItems(
                    logs.page,
                    logs.data.page_count,
                  )}
                  onPageSizeChange={logs.changePageSize}
                  onPageChange={logs.setPage}
                />
              </>
            )}
          </section>
        )}
      </div>
    </AdminShell>
  );
}

function ActivityToolbar({
  query,
  filters,
  users,
  modules,
  hasFilters,
  onQueryChange,
  onFilterChange,
  onClear,
}: {
  query: string;
  filters: ActivityLogFilters;
  users: Array<{ id: number; full_name: string; email: string }>;
  modules: string[];
  hasFilters: boolean;
  onQueryChange: (value: string) => void;
  onFilterChange: (name: keyof ActivityLogFilters, value: string) => void;
  onClear: () => void;
}) {
  return (
    <section aria-label="Activity log filters" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Search activity logs</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search users, records, modules, or changes..."
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          />
          {query ? (
            <button type="button" onClick={() => onQueryChange("")} className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Clear activity search">
              <X className="size-4" />
            </button>
          ) : null}
        </label>
        {hasFilters ? (
          <button type="button" onClick={onClear} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <X className="size-4" aria-hidden="true" />
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <FilterField label="User">
          <select value={filters.userId} onChange={(event) => onFilterChange("userId", event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
            <option value="">All users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.full_name} ({user.email})</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Action">
          <select value={filters.action} onChange={(event) => onFilterChange("action", event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
            <option value="">All actions</option>
            <option value="ADD">Add</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
          </select>
        </FilterField>
        <FilterField label="Screen / Module">
          <select value={filters.module} onChange={(event) => onFilterChange("module", event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
            <option value="">All modules</option>
            {modules.map((module) => <option key={module} value={module}>{module}</option>)}
          </select>
        </FilterField>
        <FilterField label="From date">
          <input type="date" value={filters.dateFrom} max={filters.dateTo || undefined} onChange={(event) => onFilterChange("dateFrom", event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </FilterField>
        <FilterField label="To date">
          <input type="date" value={filters.dateTo} min={filters.dateFrom || undefined} onChange={(event) => onFilterChange("dateTo", event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </FilterField>
      </div>
    </section>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function ActivityTable({ items, expandedIds, onToggle }: { items: ActivityLog[]; expandedIds: Set<number>; onToggle: (id: number) => void }) {
  return (
    <>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-275 border-collapse text-left">
          <thead>
            <tr className="bg-slate-50/85 text-xs font-bold uppercase tracking-[0.04em] text-slate-500">
              <th className="w-14 px-5 py-4"><span className="sr-only">Details</span></th>
              <th className="min-w-48 px-5 py-4">Date &amp; Time</th>
              <th className="min-w-55 px-5 py-4">User</th>
              <th className="w-30 px-5 py-4">Action</th>
              <th className="w-36 px-5 py-4">Screen / Module</th>
              <th className="min-w-65 px-5 py-4">Record / Item</th>
              <th className="min-w-80 px-5 py-4">Details</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700">
            {items.map((item) => {
              const isExpanded = expandedIds.has(item.id);
              return (
                <Fragment key={item.id}>
                  <tr className="border-t border-slate-200 transition hover:bg-blue-50/25">
                    <td className="px-5 py-4">
                      {item.changes.length > CHANGE_PREVIEW_LIMIT ? (
                        <ExpandButton item={item} isExpanded={isExpanded} onToggle={onToggle} />
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-600">
                      <time dateTime={item.created_at}>{DATE_FORMATTER.format(new Date(item.created_at))}</time>
                    </td>
                    <td className="px-5 py-4"><ActorDisplay item={item} /></td>
                    <td className="px-5 py-4"><ActionBadge action={item.action} /></td>
                    <td className="px-5 py-4 font-semibold text-slate-700">{item.module}</td>
                    <td className="px-5 py-4"><RecordDisplay item={item} /></td>
                    <td className="px-5 py-4 align-top">
                      <ActivityDetailsPreview
                        item={item}
                        isExpanded={isExpanded}
                        onToggle={onToggle}
                      />
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr className="border-t border-blue-100 bg-blue-50/35">
                      <td colSpan={7} className="px-6 py-5"><ChangeDetails item={item} /></td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 sm:p-4 lg:hidden">
        {items.map((item) => {
          const isExpanded = expandedIds.has(item.id);
          return (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><RecordDisplay item={item} /></div>
                <ActionBadge action={item.action} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-xs">
                <div><dt className="font-semibold uppercase tracking-wide text-slate-400">User</dt><dd className="mt-1"><ActorDisplay item={item} /></dd></div>
                <div><dt className="font-semibold uppercase tracking-wide text-slate-400">Module</dt><dd className="mt-1 font-semibold text-slate-700">{item.module}</dd></div>
                <div className="col-span-2"><dt className="font-semibold uppercase tracking-wide text-slate-400">Date &amp; Time</dt><dd className="mt-1 font-medium text-slate-600">{DATE_FORMATTER.format(new Date(item.created_at))}</dd></div>
              </dl>
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Details</p>
                <ActivityDetailsPreview
                  item={item}
                  isExpanded={isExpanded}
                  onToggle={onToggle}
                />
              </div>
              {isExpanded ? <div className="mt-4"><ChangeDetails item={item} /></div> : null}
            </article>
          );
        })}
      </div>
    </>
  );
}

function ExpandButton({ item, isExpanded, onToggle }: { item: ActivityLog; isExpanded: boolean; onToggle: (id: number) => void }) {
  return (
    <button type="button" onClick={() => onToggle(item.id)} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label={`${isExpanded ? "Hide" : "Show"} details for ${item.record_label}`} aria-expanded={isExpanded}>
      {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
    </button>
  );
}

function ActorDisplay({ item }: { item: ActivityLog }) {
  if (!item.performed_by) return <span className="font-semibold text-slate-500">Unknown user</span>;
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-slate-800" title={item.performed_by.full_name}>{item.performed_by.full_name}</p>
      <p className="mt-0.5 truncate text-xs text-slate-500" title={item.performed_by.email}>{item.performed_by.email}</p>
    </div>
  );
}

function RecordDisplay({ item }: { item: ActivityLog }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-slate-800" title={item.record_label}>{item.record_label}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-400">Record #{item.record_id}</p>
    </div>
  );
}

const actionClasses: Record<ActivityAction, string> = {
  ADD: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  UPDATE: "bg-amber-50 text-amber-700 ring-amber-200",
  DELETE: "bg-red-50 text-red-700 ring-red-200",
};

function ActionBadge({ action }: { action: ActivityAction }) {
  return <span className={`inline-flex rounded-lg px-2.5 py-1.5 text-xs font-bold ring-1 ring-inset ${actionClasses[action]}`}>{action[0] + action.slice(1).toLowerCase()}</span>;
}

function ActivityDetailsPreview({
  item,
  isExpanded,
  onToggle,
}: {
  item: ActivityLog;
  isExpanded: boolean;
  onToggle: (id: number) => void;
}) {
  const previewChanges = item.changes.slice(0, CHANGE_PREVIEW_LIMIT);
  const remainingCount = item.changes.length - previewChanges.length;

  return (
    <div className="min-w-0">
      <div className="space-y-2">
        {previewChanges.map((change) => (
          <ChangePreviewLine
            key={change.field}
            action={item.action}
            change={change}
          />
        ))}
      </div>
      {remainingCount > 0 ? (
        <button
          type="button"
          onClick={() => onToggle(item.id)}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Hide full details" : `Show ${remainingCount} more`}
          {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
      ) : null}
    </div>
  );
}

function ChangePreviewLine({ action, change }: { action: ActivityAction; change: ActivityChange }) {
  const label = FIELD_LABELS[change.field] ?? change.field;
  return (
    <p className="min-w-0 text-xs leading-5 text-slate-600">
      <span className="font-bold text-slate-700">{label}:</span>{" "}
      {action === "UPDATE" ? (
        <>
          <InlineValue value={change.previous_value} tone="previous" />
          <span className="mx-1 text-slate-400" aria-hidden="true">→</span>
          <span className="sr-only">changed to</span>
          <InlineValue value={change.new_value} tone="new" />
        </>
      ) : (
        <InlineValue
          value={action === "ADD" ? change.new_value : change.previous_value}
          tone={action === "ADD" ? "new" : "previous"}
        />
      )}
    </p>
  );
}

function InlineValue({ value, tone }: { value: string | null; tone: "previous" | "new" }) {
  return (
    <span className={`whitespace-pre-wrap wrap-break-word font-semibold ${tone === "new" ? "text-emerald-700" : "text-red-700"}`}>
      {displayValue(value)}
    </span>
  );
}

function ChangeDetails({ item }: { item: ActivityLog }) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Details / Changes</p>
      <div className="grid gap-3 xl:grid-cols-2">
        {item.changes.map((change) => <ChangeRow key={change.field} action={item.action} change={change} />)}
      </div>
    </div>
  );
}

function ChangeRow({ action, change }: { action: ActivityAction; change: ActivityChange }) {
  const label = FIELD_LABELS[change.field] ?? change.field;
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3.5">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      {action === "UPDATE" ? (
        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-red-600">Before</p>
            <Value value={change.previous_value} tone="previous" />
          </div>
          <span className="text-center text-slate-400" aria-hidden="true">→</span>
          <div className="min-w-0">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-emerald-600">After</p>
            <Value value={change.new_value} tone="new" />
          </div>
        </div>
      ) : (
        <div className="mt-2">
          <p className={`mb-1 text-[11px] font-bold uppercase tracking-wide ${action === "ADD" ? "text-emerald-600" : "text-red-600"}`}>
            {action === "ADD" ? "Added" : "Deleted"}
          </p>
          <Value value={action === "ADD" ? change.new_value : change.previous_value} tone={action === "ADD" ? "new" : "previous"} />
        </div>
      )}
    </div>
  );
}

function Value({ value, tone }: { value: string | null; tone: "previous" | "new" }) {
  return <span className={`block min-w-0 whitespace-pre-wrap wrap-break-word rounded-lg px-2.5 py-2 text-sm font-medium ${tone === "new" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>{displayValue(value)}</span>;
}

function displayValue(value: string | null) {
  return value === null || value.length === 0 ? "Empty" : value;
}

function ActivitySkeleton() {
  return <div aria-label="Loading activity logs" aria-busy="true" className="space-y-3 p-4">{Array.from({ length: 7 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>;
}

function ActivityEmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex min-h-100 flex-col items-center justify-center px-6 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-700"><FileClock className="size-6" /></div>
      <h3 className="mt-4 text-lg font-bold text-slate-950">{hasFilters ? "No matching activity" : "No activity logs yet"}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{hasFilters ? "Try changing or clearing the active filters." : "Manual sitemap additions, updates, and deletions will appear here."}</p>
      {hasFilters ? <button type="button" onClick={onClear} className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Clear filters</button> : null}
    </div>
  );
}

function ActivityError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="mt-5 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-start gap-2"><AlertCircle className="mt-0.5 size-4 shrink-0" />{message}</span>
      <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 self-start rounded-lg bg-white px-3 py-2 font-semibold ring-1 ring-red-200 sm:self-auto"><RotateCw className="size-4" />Retry</button>
    </div>
  );
}
