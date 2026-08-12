"use client";

import {
  BarChart3,
  CircleGauge,
  FileClock,
  FolderTree,
  Loader2,
  LogOut,
  Map,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import type { AdminUser } from "@/features/auth/types";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  admin: AdminUser;
  onLogout: () => Promise<void>;
};

const secondaryNavigation = [
  { label: "Reports", icon: BarChart3, href: undefined },
  { label: "Activity Logs", icon: FileClock, href: "/activity-logs" },
  { label: "Settings", icon: Settings, href: undefined },
];

function getInitials(fullName: string) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();
}

function SidebarContent({
  admin,
  onClose,
  onLogout,
}: {
  admin: AdminUser;
  onClose?: () => void;
  onLogout: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    setLogoutError("");
    setIsLoggingOut(true);

    try {
      await onLogout();
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Unable to sign out.",
      );
      setIsLoggingOut(false);
    }
  }

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
        {[
          { label: "Dashboard", href: "/dashboard", icon: CircleGauge },
          { label: "Sitemap", href: "/sitemap", icon: FolderTree },
        ].map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onNavigate={onClose}
              className={`flex w-full items-center gap-3 rounded-xl px-4 text-left text-sm font-semibold transition ${
                index > 0 ? "mt-2" : ""
              } ${
                isActive
                  ? "bg-blue-900/28 py-3.5 text-white shadow-inner shadow-blue-950/10"
                  : "py-3 text-blue-50 hover:bg-white/8"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon aria-hidden="true" className="size-5" />
              {item.label}
            </Link>
          );
        })}

        <div className="h-2" />

        {secondaryNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === pathname;
          return item.href ? (
            <Link
              key={item.label}
              href={item.href}
              onNavigate={onClose}
              className={`flex w-full items-center gap-3 rounded-xl px-4 text-left text-sm font-semibold transition ${
                isActive
                  ? "bg-blue-900/28 py-3.5 text-white shadow-inner shadow-blue-950/10"
                  : "py-3 text-blue-50 hover:bg-white/8"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon aria-hidden="true" className="size-5" />
              {item.label}
            </Link>
          ) : (
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

      <div className="m-4 rounded-2xl border border-white/12 bg-blue-950/18 p-3.5 shadow-inner shadow-blue-950/10 backdrop-blur-sm">
        <p className="px-1 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-200/85">
          Signed in as
        </p>
        <div className="mt-2.5 flex min-w-0 items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-white/90 bg-blue-50 text-blue-700 shadow-sm">
            <span className="text-sm font-bold">
              {getInitials(admin.full_name)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white" title={admin.full_name}>
              {admin.full_name}
            </p>
            <p className="mt-0.5 truncate text-xs text-blue-100" title={admin.email}>
              {admin.email}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
          className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/8 px-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/14 disabled:cursor-wait disabled:opacity-70"
          aria-label="Sign out"
        >
          {isLoggingOut ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <LogOut aria-hidden="true" className="size-4" />
          )}
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </button>
        {logoutError ? (
          <p
            role="alert"
            className="mt-2 rounded-lg bg-red-950/20 px-2.5 py-2 text-xs leading-5 text-red-50"
          >
            {logoutError}
          </p>
        ) : null}
      </div>
    </>
  );
}

export function Sidebar({ isOpen, onClose, admin, onLogout }: SidebarProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-67.5 flex-col bg-linear-to-b from-[#2f7fd8] via-[#2874ce] to-[#2269c2] shadow-xl lg:flex">
        <SidebarContent admin={admin} onLogout={onLogout} />
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
          <SidebarContent admin={admin} onClose={onClose} onLogout={onLogout} />
        </aside>
      </div>
    </>
  );
}
