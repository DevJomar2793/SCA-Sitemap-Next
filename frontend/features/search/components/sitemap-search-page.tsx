"use client";

import {
  ArrowRight,
  CircleAlert,
  LayoutDashboard,
  Loader2,
  Search,
  Sparkles,
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
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#2d78ce] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(111,181,246,0.42),transparent_40%),linear-gradient(145deg,#347fcf_0%,#2c75c9_52%,#2168bc_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -left-24 top-1/3 size-96 rounded-full bg-blue-300/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -right-28 bottom-0 size-112 rounded-full bg-blue-950/15 blur-3xl"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl text-white transition hover:text-blue-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <span className="grid size-9 place-items-center rounded-xl border border-white/35 bg-white/12 backdrop-blur">
            <Search className="size-4.5" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold tracking-wide">
            SCA Screen Finder
          </span>
        </Link>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/12 px-3.5 py-2.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-4 sm:text-sm"
        >
          <LayoutDashboard className="size-4" aria-hidden="true" />
          <span className="hidden xs:inline">Admin dashboard</span>
          <span className="xs:hidden">Dashboard</span>
        </Link>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-12 pt-[8vh] sm:px-8 sm:pt-[12vh] lg:pt-[14vh]">
        <form
          onSubmit={handleSubmit}
          aria-label="Search sitemap screens"
          className="mx-auto w-full max-w-3xl"
        >
          <label htmlFor="screen-search" className="sr-only">
            Search screen number
          </label>
          <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/70 bg-white px-4 py-2 shadow-[0_22px_55px_rgba(8,48,105,0.25)] sm:min-h-16 sm:px-5 lg:min-h-18">
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
              placeholder="Search Screen Number"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-lg font-medium text-slate-800 outline-none placeholder:text-slate-400 sm:text-2xl lg:text-3xl"
            />
            <button
              type="submit"
              disabled={isSearching}
              aria-label="Search"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-600/25 transition hover:scale-[1.04] hover:from-blue-600 hover:to-blue-800 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-300 disabled:cursor-wait disabled:opacity-70 sm:size-12"
            >
              {isSearching ? (
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              ) : (
                <ArrowRight className="size-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </form>

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
        ) : (
          <SearchWelcome />
        )}
      </div>

      <div className="relative z-10">
        <AppFooter variant="brand" />
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
    <section className="mx-auto mt-15 text-center sm:mt-18">
      <div className="search-illustration relative mx-auto size-34 sm:size-40">
        <div className="absolute inset-4 rotate-6 rounded-[42%_58%_48%_52%/48%_40%_60%_52%] bg-linear-to-br from-white/90 to-blue-100/75 shadow-[0_20px_40px_rgba(8,48,105,0.15)]" />
        <div className="absolute inset-0 grid place-items-center">
          <Search
            className="size-18 text-blue-700 sm:size-21"
            strokeWidth={2.3}
            aria-hidden="true"
          />
        </div>
        <Sparkles
          className="absolute -right-1 top-7 size-5 text-white"
          aria-hidden="true"
        />
        <span className="absolute left-0 top-12 size-2 rounded-full bg-white" />
        <span className="absolute bottom-9 right-0 size-2 rounded-full bg-blue-100" />
        <span className="absolute -bottom-1 left-1/2 h-2 w-30 -translate-x-1/2 rounded-full bg-blue-950/22 blur-[1px]" />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-[-0.035em] text-white sm:text-4xl lg:text-[42px]">
        What can I help you find?
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-blue-50 sm:text-lg">
        Search a screen number to see its description, file details, and the
        exact instructions for navigating to it.
      </p>
    </section>
  );
}
