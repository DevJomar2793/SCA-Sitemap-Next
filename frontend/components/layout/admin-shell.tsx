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
};

export function AdminShell({
  admin,
  title,
  section,
  children,
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
    <div className="min-h-screen bg-[#f7f9fc]">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        admin={admin}
        onLogout={handleLogout}
      />

      <main className="flex min-h-screen flex-col lg:ml-67.5">
        <AdminHeader
          onOpenSidebar={() => setIsSidebarOpen(true)}
          title={title}
          section={section}
        />
        <div className="flex-1">{children}</div>
        <AppFooter />
      </main>
    </div>
  );
}
