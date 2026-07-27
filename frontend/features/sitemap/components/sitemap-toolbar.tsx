"use client";

import {
  Download,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import type { SitemapFilters } from "../types";

type FilterOptions = {
  alphas: string[];
  screenTypes: string[];
  notes: string[];
};

type SitemapToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  filters: SitemapFilters;
  filterOptions: FilterOptions;
  activeFilterCount: number;
  isFilterOpen: boolean;
  onToggleFilter: () => void;
  onUpdateFilter: (name: keyof SitemapFilters, value: string) => void;
  onClearFilters: () => void;
  onExport: () => void;
  isExportDisabled: boolean;
  onAdd: () => void;
};

export function SitemapToolbar({
  query,
  onQueryChange,
  filters,
  filterOptions,
  activeFilterCount,
  isFilterOpen,
  onToggleFilter,
  onUpdateFilter,
  onClearFilters,
  onExport,
  isExportDisabled,
  onAdd,
}: SitemapToolbarProps) {
  return (
    <section
      aria-label="Sitemap controls"
      className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"
    >
      <label className="relative block w-full xl:max-w-[620px]">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-500"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search screens, file labels, notes..."
          className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </label>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative" data-popover>
          <button
            type="button"
            onClick={onToggleFilter}
            className="relative inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-expanded={isFilterOpen}
          >
            <Filter className="size-4" />
            Filter
            {activeFilterCount > 0 ? (
              <span className="grid size-5 place-items-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          {isFilterOpen ? (
            <div className="absolute right-0 top-13 z-40 w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:left-0 sm:right-auto xl:left-auto xl:right-0">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <SlidersHorizontal className="size-4 text-blue-600" />
                  Filter pages
                </p>
                {activeFilterCount > 0 ? (
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Clear all
                  </button>
                ) : null}
              </div>
              <div className="mt-4 space-y-3">
                <FilterSelect
                  label="Alpha"
                  value={filters.alpha}
                  options={filterOptions.alphas}
                  emptyLabel="All alpha groups"
                  onChange={(value) => onUpdateFilter("alpha", value)}
                />
                <FilterSelect
                  label="Screen type"
                  value={filters.screenType}
                  options={filterOptions.screenTypes}
                  emptyLabel="All screen types"
                  onChange={(value) => onUpdateFilter("screenType", value)}
                />
                <FilterSelect
                  label="Notes / status"
                  value={filters.notes}
                  options={filterOptions.notes}
                  emptyLabel="All notes"
                  onChange={(value) => onUpdateFilter("notes", value)}
                />
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onExport}
          disabled={isExportDisabled}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-4" />
          Export
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 sm:flex-none sm:px-5"
        >
          <Plus className="size-5" />
          <span className="sm:hidden">Add Page</span>
          <span className="hidden sm:inline">Add Screen</span>
        </button>
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  options,
  emptyLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  emptyLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
