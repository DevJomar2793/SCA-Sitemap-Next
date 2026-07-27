"use client";

import { Bell, Menu } from "lucide-react";

type SitemapHeaderProps = {
  onOpenSidebar: () => void;
};

export function SitemapHeader({ onOpenSidebar }: SitemapHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-26 max-w-[1800px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-9">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-[25px] font-bold tracking-[-0.03em] text-slate-950 sm:text-[28px]">
              Sitemap Pages
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="font-semibold text-blue-600">Sitemap</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500">Sitemap Pages</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            className="relative grid size-10 place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-red-500 text-[9px] font-bold text-white">
              3
            </span>
          </button>
          {/* <button
            type="button"
            className="grid size-10 place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100"
            aria-label="User profile"
          >
            <UserRound className="size-5" />
          </button> */}
        </div>
      </div>
    </header>
  );
}
