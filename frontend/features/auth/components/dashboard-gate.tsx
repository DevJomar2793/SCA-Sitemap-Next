"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getStoredAuthenticatedAdmin } from "@/features/auth/api";
import type { AdminUser } from "@/features/auth/types";
import { SitemapDashboard } from "@/features/sitemap/components/sitemap-dashboard";

export function DashboardGate() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    const storedAdmin = getStoredAuthenticatedAdmin();
    if (storedAdmin) {
      // This browser-only session lookup runs after hydration by design.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAdmin(storedAdmin);
    } else {
      router.replace("/login");
    }
  }, [router]);

  if (!admin) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f9fc] px-5">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <Loader2 className="size-5 animate-spin text-blue-600" aria-hidden="true" />
          Verifying your session...
        </div>
      </main>
    );
  }

  return <SitemapDashboard admin={admin} />;
}
