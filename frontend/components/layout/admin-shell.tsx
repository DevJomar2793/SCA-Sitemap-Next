"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import {
  clearStoredAuthenticatedAdmin,
  logout,
} from "@/features/auth/api";
import type { AdminUser } from "@/features/auth/types";
import { AdminHeader } from "@/features/sitemap/components/sitemap-header";

import { AppFooter } from "./app-footer";
import { Sidebar } from "./sidebar";

type AdminShellProps = {
  admin: AdminUser;
  title: string;
  section: string;
  children: ReactNode;
  appearance?: "default" | "finder";
};

export function AdminShell({
  admin,
  title,
  section,
  children,
  appearance = "default",
}: AdminShellProps) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearStoredAuthenticatedAdmin();
      router.replace("/login");
    }
  }

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden ${
        appearance === "finder" ? "bg-[#031b4d]" : "bg-[#f7f9fc]"
      }`}
    >
      {appearance === "finder" ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_54%_0%,rgba(21,103,235,0.65),transparent_50%),radial-gradient(ellipse_at_92%_78%,rgba(0,93,255,0.28),transparent_30%),linear-gradient(135deg,#031942_0%,#052b70_48%,#03163d_100%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none fixed -bottom-48 left-48 size-[30rem] rounded-full border border-blue-500/25 shadow-[inset_0_0_0_3.5rem_rgba(16,95,228,0.1),inset_0_0_0_7rem_rgba(16,95,228,0.06)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none fixed -right-40 -top-40 size-120 rounded-full border border-blue-400/30 shadow-[inset_0_0_0_5rem_rgba(21,104,255,0.14)]"
          />
        </>
      ) : null}

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        admin={admin}
        onLogout={handleLogout}
        appearance={appearance}
      />

      <main className="relative flex min-h-screen flex-col lg:ml-67.5">
        <AdminHeader
          onOpenSidebar={() => setIsSidebarOpen(true)}
          title={title}
          section={section}
          appearance={appearance}
        />
        <div className="flex-1">{children}</div>
        <AppFooter variant={appearance === "finder" ? "brand" : "light"} />
      </main>
    </div>
  );
}
