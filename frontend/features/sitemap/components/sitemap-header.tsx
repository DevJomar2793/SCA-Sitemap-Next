"use client";

import { Menu } from "lucide-react";

type AdminHeaderProps = {
  onOpenSidebar: () => void;
  title: string;
  section: string;
  appearance?: "default" | "finder";
};

export function AdminHeader({
  onOpenSidebar,
  title,
  section,
  appearance = "default",
}: AdminHeaderProps) {
  const isFinder = appearance === "finder";

  return (
    <header
      className={
        isFinder
          ? "border-b border-blue-300/25 bg-blue-950/25 backdrop-blur-xl"
          : "border-b border-slate-200 bg-white"
      }
    >
      <div className="mx-auto flex min-h-26 max-w-[1800px] items-center gap-4 px-4 sm:px-7 lg:px-9">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className={`grid size-10 shrink-0 place-items-center rounded-xl border shadow-sm transition lg:hidden ${
              isFinder
                ? "border-blue-300/35 bg-white/10 text-white hover:bg-white/15"
                : "border-slate-200 bg-white text-slate-700"
            }`}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <h1
              className={`truncate text-[25px] font-bold tracking-[-0.03em] sm:text-[28px] ${
                isFinder ? "text-white" : "text-slate-950"
              }`}
            >
              {title}
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span
                className={`font-semibold ${
                  isFinder ? "text-sky-300" : "text-blue-600"
                }`}
              >
                {section}
              </span>
              <span className={isFinder ? "text-blue-300/60" : "text-slate-300"}>
                /
              </span>
              <span className={isFinder ? "text-blue-100" : "text-slate-500"}>
                {title}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
