"use client";

import {
  BarChart3,
  ChevronDown,
  CircleGauge,
  FileClock,
  FolderTree,
  Map,
  Settings,
  X,
} from "lucide-react";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const secondaryNavigation = [
  { label: "Reports", icon: BarChart3 },
  { label: "Activity Logs", icon: FileClock },
  { label: "Settings", icon: Settings },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  return (
    <>
      <div className="flex h-29 items-center justify-between px-7">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-xl border-2 border-white/85 bg-white/12 shadow-sm">
            <Map
              aria-hidden="true"
              className="size-7 text-white"
              strokeWidth={2}
            />
          </div>
          <div>
            <p className="text-[21px] font-bold tracking-[-0.02em] text-white">
              SCA Sitemap
            </p>
            <p className="mt-0.5 text-xs font-medium text-blue-100">
              Administration Portal
            </p>
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg text-blue-100 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-5">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-blue-50 transition hover:bg-white/8"
        >
          <CircleGauge aria-hidden="true" className="size-5" />
          Dashboard
        </button>

        <button
          type="button"
          className="mt-2 flex w-full items-center gap-3 rounded-xl bg-blue-900/28 px-4 py-3.5 text-left text-sm font-semibold text-white shadow-inner shadow-blue-950/10"
          aria-current="page"
        >
          <FolderTree aria-hidden="true" className="size-5" />
          Sitemap
        </button>

        <div className="h-2" />

        {secondaryNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-blue-50 transition hover:bg-white/8"
            >
              <Icon aria-hidden="true" className="size-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="m-4 rounded-2xl bg-blue-900/20 p-3 shadow-inner shadow-blue-950/10">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl p-1 text-left"
        >
          <div className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-white bg-blue-100 text-blue-700">
            <span className="text-sm font-bold">JC</span>
          </div>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">
              Jomar Cerrado
            </span>
            <span className="mt-0.5 block text-xs text-blue-100">
              Administrator
            </span>
          </span>
          <ChevronDown aria-hidden="true" className="size-4 text-blue-100" />
        </button>
      </div>
    </>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-67.5 flex-col bg-linear-to-b from-[#2f7fd8] via-[#2874ce] to-[#2269c2] shadow-xl lg:flex">
        <SidebarContent />
      </aside>

      <div
        className={`fixed inset-0 z-50 transition lg:hidden ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
          aria-label="Close navigation"
          tabIndex={isOpen ? 0 : -1}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-71.5 max-w-[86vw] flex-col bg-linear-to-b from-[#2f7fd8] via-[#2874ce] to-[#2269c2] shadow-2xl transition-transform duration-200 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent onClose={onClose} />
        </aside>
      </div>
    </>
  );
}
