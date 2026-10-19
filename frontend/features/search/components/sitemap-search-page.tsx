"use client";

import {
  ArrowRight,
  CircleAlert,
  FileText,
  FolderOpen,
  Info,
  Loader2,
  Navigation,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { AppFooter } from "@/components/layout/app-footer";
import { searchSitemapPages } from "@/features/sitemap/api";
import type { SitemapPage } from "@/features/sitemap/types";

import { SearchResultsModal } from "./search-results-modal";

export function SitemapSearchPage() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [results, setResults] = useState<SitemapPage[] | null>(null);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      setError("Enter a screen number to start your search.");
      setResults(null);
      return;
    }

    setIsSearching(true);
    setError("");
    setSubmittedQuery(normalizedQuery);
    setResults(null);

    try {
      setResults(await searchSitemapPages(normalizedQuery));
    } catch (searchError) {
      setResults(null);
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Unable to search sitemap pages.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#031b4d] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(21,103,235,0.72),transparent_54%),radial-gradient(ellipse_at_8%_72%,rgba(0,93,255,0.34),transparent_28%),linear-gradient(135deg,#031942_0%,#052b70_48%,#03163d_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-44 bottom-[-12rem] size-[30rem] rounded-full border border-blue-500/35 shadow-[inset_0_0_0_3.5rem_rgba(16,95,228,0.12),inset_0_0_0_7rem_rgba(16,95,228,0.08)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -right-36 -top-36 size-120 rounded-full border border-blue-400/40 shadow-[inset_0_0_0_5rem_rgba(21,104,255,0.2)]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center px-5 py-5 sm:px-8 sm:py-6">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl text-white transition hover:text-blue-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <span className="grid size-12 place-items-center rounded-2xl border border-sky-300/80 bg-blue-500/25 shadow-[0_0_28px_rgba(38,149,255,0.22)] backdrop-blur sm:size-14">
            <Search className="size-6" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight sm:text-2xl">
            SCA Screen Finder
          </span>
        </Link>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-12 pt-9 sm:px-8 sm:pt-14 lg:pt-10">
        {results === null && !isSearching ? <SearchWelcome /> : null}

        <form
          onSubmit={handleSubmit}
          aria-label="Search sitemap screens"
          className="mx-auto w-full max-w-4xl"
        >
          <label htmlFor="screen-search" className="sr-only">
            Search screen number
          </label>
          <div className="flex min-h-16 items-center gap-3 rounded-3xl border border-white/80 bg-white px-4 py-2 shadow-[0_22px_55px_rgba(0,13,45,0.38)] sm:min-h-20 sm:px-7">
            <Search
              className="size-5 shrink-0 text-slate-400"
              strokeWidth={2}
              aria-hidden="true"
            />
            <input
              id="screen-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                if (error) {
                  setError("");
                }
              }}
              placeholder="Enter screen number (e.g. 1024)"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-base font-medium text-slate-800 outline-none placeholder:text-slate-400 sm:text-xl"
            />
            <button
              type="submit"
              disabled={isSearching}
              aria-label="Search"
              className="grid size-12 shrink-0 place-items-center rounded-full bg-linear-to-br from-sky-400 via-blue-500 to-blue-700 text-white shadow-lg shadow-blue-600/40 transition hover:scale-[1.04] hover:from-sky-300 hover:to-blue-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-300 disabled:cursor-wait disabled:opacity-70 sm:size-16"
            >
              {isSearching ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowRight className="size-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </form>

        {!error && !isSearching && results === null ? (
          <p className="relative z-10 mx-auto mt-5 flex items-center gap-2 text-sm text-blue-100">
            <Info className="size-5" aria-hidden="true" />
            Enter a screen number to get started
          </p>
        ) : null}

        {results === null && !isSearching ? <SearchFeatures /> : null}

        {error ? (
          <div
            role="alert"
            className="mx-auto mt-4 flex items-center gap-2 rounded-xl border border-red-100/50 bg-red-950/28 px-4 py-3 text-sm text-white backdrop-blur"
          >
            <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        ) : null}

        {isSearching ? (
          <section
            aria-live="polite"
            aria-busy={isSearching}
            className="mx-auto mt-10 w-full max-w-4xl"
          >
            <div className="flex items-center justify-center gap-3 py-16 text-blue-50">
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              <p className="text-sm font-semibold">
                Looking for screen {submittedQuery}...
              </p>
            </div>
          </section>
        ) : results?.length === 0 ? (
          <section
            aria-live="polite"
            className="mx-auto mt-10 w-full max-w-4xl"
          >
            <div className="animate-search-result rounded-3xl border border-white/30 bg-white/12 px-6 py-12 text-center shadow-xl backdrop-blur-md">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/15">
                <Search className="size-6 text-blue-50" aria-hidden="true" />
              </div>
              <h1 className="mt-4 text-xl font-bold text-white">
                No matching screen found
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-blue-100">
                Check the screen number or try a prefixed identifier such as
                A-03.
              </p>
            </div>
          </section>
        ) : null}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div className="border-t border-blue-300/35">
          <AppFooter variant="brand" />
        </div>
      </div>

      {results?.length ? (
        <SearchResultsModal
          query={submittedQuery}
          results={results}
          onClose={() => setResults(null)}
        />
      ) : null}
    </main>
  );
}

function SearchWelcome() {
  return (
    <section className="relative mx-auto mb-8 w-full text-center sm:mb-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-5 top-20 hidden grid-cols-5 gap-3 opacity-50 sm:grid"
      >
        {Array.from({ length: 25 }, (_, index) => (
          <span key={index} className="size-1.5 rounded-full bg-blue-500" />
        ))}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300 sm:text-sm">
        Screen navigation, simplified
      </p>
      <div className="mx-auto mt-5 h-1.5 w-20 rounded-full bg-linear-to-r from-sky-400 to-blue-500 shadow-[0_0_18px_rgba(56,189,248,0.5)]" />
      <h1 className="mx-auto mt-8 max-w-5xl text-4xl font-bold leading-tight tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
        Find the right screen. <span className="text-sky-400">Faster.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-blue-100 sm:text-xl sm:leading-8">
        Search a screen number to view its description, file details,
        <br className="hidden sm:block" /> and step-by-step navigation instructions.
      </p>
    </section>
  );
}

function SearchFeatures() {
  return (
    <section
      aria-label="What you can find"
      className="mx-auto mt-8 grid w-full max-w-4xl gap-3 text-left sm:mt-12 sm:grid-cols-3 sm:gap-4"
    >
        <FeatureCard
          icon={FileText}
          title="Screen details"
          description="View screen description and key information"
          iconStyle="bg-blue-500/55 text-sky-100"
        />
        <FeatureCard
          icon={FolderOpen}
          title="File references"
          description="Check related files and locations"
          iconStyle="bg-indigo-500/45 text-indigo-200"
        />
        <FeatureCard
          icon={Navigation}
          title="Navigation steps"
          description="Get step-by-step instructions"
          iconStyle="bg-teal-500/45 text-teal-200"
        />
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  iconStyle,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
  iconStyle: string;
}) {
  return (
    <div className="flex min-h-32 items-center gap-4 rounded-2xl border border-blue-400/35 bg-blue-950/25 p-4 backdrop-blur-sm sm:p-5">
      <span className={`grid size-16 shrink-0 place-items-center rounded-2xl ${iconStyle}`}>
        <Icon className="size-8" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span>
        <span className="block text-lg font-bold text-white">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-blue-100">{description}</span>
      </span>
    </div>
  );
}
