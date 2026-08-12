"use client";

import {
  AlertCircle,
  ArrowRight,
  Clock3,
  FileStack,
  FolderTree,
  Layers3,
  RotateCw,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import type { AdminUser } from "@/features/auth/types";
import { useSitemapPages } from "@/features/sitemap/hooks/use-sitemap-pages";

import { deriveDashboardSummary, type DashboardBreakdown } from "../utils";

export function AdminOverview({ admin }: { admin: AdminUser }) {
  const { pages, isLoading, loadError, loadPages } = useSitemapPages();
  const summary = useMemo(() => deriveDashboardSummary(pages), [pages]);

  return (
    <AdminShell admin={admin} title="Dashboard" section="Overview">
      <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-7 lg:px-9 lg:py-7">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Welcome back</p>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.025em] text-slate-950">
              Sitemap at a glance
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Review catalogue coverage and recently updated screens.
            </p>
          </div>
          <Link
            href="/sitemap"
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:self-auto"
          >
            Manage sitemap
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {loadError ? (
          <DashboardError message={loadError} onRetry={() => void loadPages()} />
        ) : isLoading ? (
          <DashboardSkeleton />
        ) : pages.length === 0 ? (
          <DashboardEmptyState />
        ) : (
          <>
            <section
              aria-label="Sitemap summary"
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              <MetricCard
                label="Total pages"
                value={summary.totalPages}
                icon={FileStack}
                color="blue"
              />
              <MetricCard
                label="Alpha groups"
                value={summary.alphaCount}
                icon={Layers3}
                color="violet"
              />
              <MetricCard
                label="Screen types"
                value={summary.screenTypeCount}
                icon={Tags}
                color="cyan"
              />
              <MetricCard
                label="Updated in 7 days"
                value={summary.recentlyUpdatedCount}
                icon={Clock3}
                color="emerald"
              />
            </section>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <BreakdownPanel
                title="Pages by Alpha"
                description="Distribution across Alpha groups"
                items={summary.alphaBreakdown}
              />
              <BreakdownPanel
                title="Pages by screen type"
                description="Distribution across screen classifications"
                items={summary.screenTypeBreakdown}
              />
            </div>

            <RecentPages pages={summary.recentPages} />
          </>
        )}
      </div>
    </AdminShell>
  );
}

const metricColors = {
  blue: "bg-blue-50 text-blue-700",
  violet: "bg-violet-50 text-violet-700",
  cyan: "bg-cyan-50 text-cyan-700",
  emerald: "bg-emerald-50 text-emerald-700",
};

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof FileStack;
  color: keyof typeof metricColors;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-950">
            {value.toLocaleString()}
          </p>
        </div>
        <div className={`grid size-11 place-items-center rounded-xl ${metricColors[color]}`}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}

function BreakdownPanel({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: DashboardBreakdown[];
}) {
  const maximumCount = Math.max(...items.map((item) => item.count), 1);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-6 max-h-80 space-y-5 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
              <span className="truncate font-semibold text-slate-700" title={item.label}>
                {item.label}
              </span>
              <span className="shrink-0 font-medium text-slate-500">
                {item.count} · {item.percentage}%
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full min-w-1 rounded-full bg-linear-to-r from-blue-500 to-blue-700"
                style={{ width: `${(item.count / maximumCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentPages({
  pages,
}: {
  pages: ReturnType<typeof deriveDashboardSummary>["recentPages"];
}) {
  const dateFormatter = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
        <div>
          <h3 className="text-lg font-bold text-slate-950">Recently updated</h3>
          <p className="mt-1 text-sm text-slate-500">The latest five sitemap changes</p>
        </div>
        <Link href="/sitemap" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
          View all
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {pages.map((page) => (
          <Link
            key={page.id}
            href="/sitemap"
            className="grid gap-2 px-5 py-4 transition hover:bg-slate-50 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-5 sm:px-6"
          >
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-blue-600">
                {page.alpha}-{page.screen_number}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800" title={page.screen_label}>
                {page.screen_label}
              </p>
            </div>
            <span className="justify-self-start rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
              {page.screen_type}
            </span>
            <time className="text-xs font-medium text-slate-500" dateTime={page.updated_at}>
              {dateFormatter.format(new Date(page.updated_at))}
            </time>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </span>
      <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 self-start rounded-lg bg-white px-3 py-2 font-semibold ring-1 ring-red-200 sm:self-auto">
        <RotateCw className="size-4" aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}

function DashboardEmptyState() {
  return (
    <section className="grid min-h-100 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-5 text-center shadow-sm">
      <div>
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-700">
          <FolderTree className="size-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-950">No sitemap pages yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Add or import sitemap pages to populate your dashboard overview.
        </p>
        <Link href="/sitemap" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          Open sitemap
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-label="Loading dashboard" aria-busy="true" className="animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="h-84 rounded-2xl border border-slate-200 bg-white" />
        <div className="h-84 rounded-2xl border border-slate-200 bg-white" />
      </div>
      <div className="mt-6 h-80 rounded-2xl border border-slate-200 bg-white" />
    </div>
  );
}
