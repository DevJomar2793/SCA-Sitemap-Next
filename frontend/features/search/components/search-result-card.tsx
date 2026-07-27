import {
  Compass,
  FileText,
  MapPin,
  Monitor,
  Tag,
} from "lucide-react";

import type { SitemapPage } from "@/features/sitemap/types";

type SearchResultCardProps = {
  page: SitemapPage;
};

export function SearchResultCard({ page }: SearchResultCardProps) {
  return (
    <article className="animate-search-result overflow-hidden rounded-3xl border border-white/70 bg-white/96 shadow-[0_24px_60px_rgba(13,54,119,0.2)] backdrop-blur">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-7">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700">
            <Monitor className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
              Screen {page.alpha}-{page.screen_number}
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.025em] text-slate-950 sm:text-2xl">
              {page.screen_label}
            </h2>
          </div>
        </div>
        <span className="self-start rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
          {page.screen_type}
        </span>
      </div>

      <div className="grid gap-5 px-5 py-6 sm:px-7 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <ResultField
            icon={FileText}
            label="Description"
            value={page.screen_description}
          />
          <ResultField icon={Tag} label="File label" value={page.file_label} />
          <ResultField icon={MapPin} label="Notes" value={page.notes} />
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-5">
          <div className="flex items-center gap-2 text-blue-700">
            <Compass className="size-5" aria-hidden="true" />
            <h3 className="text-sm font-bold">Navigation instructions</h3>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {page.page_location}
          </p>
        </div>
      </div>
    </article>
  );
}

function ResultField({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        className="mt-0.5 size-4.5 shrink-0 text-slate-400"
        aria-hidden="true"
      />
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}
