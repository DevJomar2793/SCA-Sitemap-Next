"use client";

import { AlertCircle, Loader2, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentAdmin } from "@/features/auth/api";
import type { AdminUser } from "@/features/auth/types";
import { SitemapDashboard } from "@/features/sitemap/components/sitemap-dashboard";
import { ApiRequestError } from "@/lib/api-client";

export function DashboardGate() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void getCurrentAdmin(controller.signal)
      .then((currentAdmin) => setAdmin(currentAdmin))
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (requestError instanceof ApiRequestError && requestError.status === 401) {
          router.replace("/login");
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to verify your session.",
        );
      });

    return () => controller.abort();
  }, [attempt, router]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f9fc] px-5">
        <section className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto size-8 text-red-500" aria-hidden="true" />
          <h1 className="mt-3 text-lg font-bold text-slate-950">
            Unable to verify your session
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError("");
              setAttempt((value) => value + 1);
            }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <RotateCw className="size-4" aria-hidden="true" />
            Try again
          </button>
        </section>
      </main>
    );
  }

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
