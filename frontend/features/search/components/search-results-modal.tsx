"use client";

import {
  CalendarClock,
  Check,
  Compass,
  FileText,
  Fingerprint,
  Info,
  Layers3,
  Monitor,
  Tag,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

import { useAnimatedDialog } from "@/features/sitemap/hooks/use-animated-dialog";
import { useDialogKeyboard } from "@/features/sitemap/hooks/use-dialog-keyboard";
import type { SitemapPage } from "@/features/sitemap/types";

type SearchResultsModalProps = {
  query: string;
  results: SitemapPage[];
  onClose: () => void;
};

type DetailValue = string | number | null | undefined;

function displayValue(value: DetailValue): string {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "Not provided";
  }
  return String(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return displayValue(value);
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function recordName(page: SitemapPage): string {
  return `${displayValue(page.alpha)}-${displayValue(page.screen_number)}`;
}

export function SearchResultsModal({
  query,
  results,
  onClose,
}: SearchResultsModalProps) {
  const [selectedId, setSelectedId] = useState(results[0]?.id);
  const dialogRef = useRef<HTMLDivElement>(null);
  const { isClosing, requestClose } = useAnimatedDialog(onClose, false);
  const selectedPage =
    results.find((page) => page.id === selectedId) ?? results[0];

  useDialogKeyboard(dialogRef, requestClose);

  if (!selectedPage) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-80 grid place-items-center bg-slate-950/55 p-3 backdrop-blur-[3px] sm:p-5 ${
        isClosing
          ? "animate-dialog-backdrop-out"
          : "animate-dialog-backdrop-in"
      }`}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          requestClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-results-modal-title"
        className={`flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.32)] sm:max-h-[calc(100dvh-2.5rem)] ${
          isClosing ? "animate-dialog-out" : "animate-dialog-in"
        }`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-7 sm:py-5">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <Monitor className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                Search results
              </p>
              <h2
                id="search-results-modal-title"
                className="mt-1 truncate text-lg font-bold tracking-[-0.02em] text-slate-950 sm:text-xl"
              >
                {results.length} {results.length === 1 ? "screen" : "screens"}{" "}
                found for “{query}”
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            aria-label="Close search results"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:overflow-hidden">
          {results.length > 1 ? (
            <>
              <aside
                aria-label="Matching screens"
                className="hidden min-h-0 overflow-y-auto border-r border-slate-200 bg-slate-50/80 p-3 lg:block"
              >
                <p className="px-2 pb-2 pt-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                  Select a record
                </p>
                <div className="space-y-1.5">
                  {results.map((page) => {
                    const isActive = page.id === selectedPage.id;
                    return (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => setSelectedId(page.id)}
                        aria-pressed={isActive}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                          isActive
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-700 hover:bg-white"
                        }`}
                      >
                        <span
                          className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                            isActive
                              ? "bg-white/16 text-white"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {page.alpha || "—"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold">
                            {recordName(page)}
                          </span>
                          <span
                            className={`mt-0.5 block truncate text-xs ${
                              isActive ? "text-blue-100" : "text-slate-500"
                            }`}
                          >
                            {displayValue(page.screen_label)}
                          </span>
                        </span>
                        {isActive ? (
                          <Check className="size-4 shrink-0" aria-hidden="true" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </aside>

              <label className="sticky top-0 z-10 block border-b border-slate-200 bg-white px-5 py-4 lg:hidden">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
                  Select a record
                </span>
                <select
                  value={selectedPage.id}
                  onChange={(event) => setSelectedId(Number(event.target.value))}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                >
                  {results.map((page) => (
                    <option key={page.id} value={page.id}>
                      {recordName(page)} — {displayValue(page.screen_label)}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          <div
            key={selectedPage.id}
            className={`animate-search-result min-h-0 px-5 py-6 sm:px-7 lg:overflow-y-auto lg:px-8 ${
              results.length === 1 ? "lg:col-span-2" : ""
            }`}
          >
            <div className="mb-7 flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
                  Screen {recordName(selectedPage)}
                </p>
                <h3 className="mt-1.5 text-2xl font-bold tracking-[-0.03em] text-slate-950">
                  {displayValue(selectedPage.screen_label)}
                </h3>
              </div>
              <span className="self-start rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                {displayValue(selectedPage.screen_type)}
              </span>
            </div>

            <div className="space-y-8">
              <DetailSection
                icon={Fingerprint}
                title="Record identity"
                fields={[
                  { label: "Record ID", value: selectedPage.id },
                  { label: "Alpha", value: selectedPage.alpha },
                  {
                    label: "Screen number",
                    value: selectedPage.screen_number,
                  },
                  { label: "Screen type", value: selectedPage.screen_type },
                ]}
              />
              <DetailSection
                icon={Layers3}
                title="Screen information"
                fields={[
                  { label: "Screen label", value: selectedPage.screen_label },
                  { label: "File label", value: selectedPage.file_label },
                  {
                    label: "Screen description",
                    value: selectedPage.screen_description,
                    wide: true,
                  },
                ]}
              />
              <DetailSection
                icon={Compass}
                title="Guidance"
                fields={[
                  {
                    label: "Navigation instructions",
                    value: selectedPage.page_location,
                    wide: true,
                  },
                  {
                    label: "Notes",
                    value: selectedPage.notes,
                    wide: true,
                  },
                ]}
              />
              <DetailSection
                icon={CalendarClock}
                title="Record metadata"
                fields={[
                  {
                    label: "Created at",
                    value: formatDate(selectedPage.created_at),
                  },
                  {
                    label: "Updated at",
                    value: formatDate(selectedPage.updated_at),
                  },
                ]}
              />
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/80 px-5 py-3.5 sm:px-7">
          <p className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <Info className="size-3.5" aria-hidden="true" />
            Read-only sitemap record
          </p>
          <button
            type="button"
            onClick={requestClose}
            className="ml-auto rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

function DetailSection({
  icon: Icon,
  title,
  fields,
}: {
  icon: typeof FileText;
  title: string;
  fields: Array<{
    label: string;
    value: DetailValue;
    wide?: boolean;
  }>;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2 text-slate-900">
        <Icon className="size-4.5 text-blue-600" aria-hidden="true" />
        <h4 className="text-sm font-bold">{title}</h4>
      </div>
      <dl className="grid gap-x-7 gap-y-5 sm:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.label}
            className={field.wide ? "sm:col-span-2" : ""}
          >
            <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-slate-400">
              {field.label === "File label" ? (
                <Tag className="size-3.5" aria-hidden="true" />
              ) : field.label === "Screen description" ? (
                <FileText className="size-3.5" aria-hidden="true" />
              ) : null}
              {field.label}
            </dt>
            <dd className="mt-1.5 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-700">
              {displayValue(field.value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
