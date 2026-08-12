"use client";

import { AlertCircle, Loader2, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";

import { ActivityLogsPage } from "@/features/activity-logs/components/activity-logs-page";
import { AdminOverview } from "@/features/dashboard/components/admin-overview";
import { SitemapDashboard } from "@/features/sitemap/components/sitemap-dashboard";
import {
  AUTHENTICATION_FAILURE_EVENT,
  ApiRequestError,
  type AuthenticationFailureReason,
} from "@/lib/api-client";

import {
  clearStoredAuthenticatedAdmin,
  getSession,
  getStoredAuthenticatedSession,
} from "../api";
import type { AdminSession } from "../types";

const MAXIMUM_TIMEOUT_MS = 2_147_000_000;

export function AdminPageGate({
  page,
}: {
  page: "activity-logs" | "dashboard" | "sitemap";
}) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [verificationError, setVerificationError] = useState("");
  const [verificationAttempt, setVerificationAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let expirationTimer: ReturnType<typeof setTimeout> | undefined;
    const storedSession = getStoredAuthenticatedSession();
    let expiresAt = storedSession
      ? new Date(storedSession.expires_at).getTime()
      : 0;

    function redirectToLogin(reason: AuthenticationFailureReason) {
      clearStoredAuthenticatedAdmin();
      window.location.replace(
        reason === "expired" ? "/login?reason=expired" : "/login",
      );
    }

    function handleAuthenticationFailure(event: Event) {
      const reason = (event as CustomEvent<AuthenticationFailureReason>).detail;
      redirectToLogin(
        reason === "invalid" && expiresAt > 0 && Date.now() >= expiresAt
          ? "expired"
          : reason,
      );
    }

    function expireIfNeeded() {
      if (expiresAt > 0 && Date.now() >= expiresAt) {
        redirectToLogin("expired");
      }
    }

    function scheduleExpiration() {
      const remainingTime = expiresAt - Date.now();
      if (remainingTime <= 0) {
        redirectToLogin("expired");
        return;
      }
      expirationTimer = setTimeout(
        scheduleExpiration,
        Math.min(remainingTime, MAXIMUM_TIMEOUT_MS),
      );
    }

    window.addEventListener(
      AUTHENTICATION_FAILURE_EVENT,
      handleAuthenticationFailure,
    );
    document.addEventListener("visibilitychange", expireIfNeeded);

    async function verifySession() {
      try {
        const verifiedSession = await getSession(controller.signal);
        expiresAt = new Date(verifiedSession.expires_at).getTime();
        if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
          redirectToLogin("expired");
          return;
        }

        scheduleExpiration();
        setSession(verifiedSession);
        setVerificationError("");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (error instanceof ApiRequestError && error.status === 401) {
          return;
        }
        setVerificationError(
          error instanceof Error
            ? error.message
            : "Unable to verify your session.",
        );
      }
    }

    if (expiresAt > 0 && Date.now() >= expiresAt) {
      redirectToLogin("expired");
    } else {
      void verifySession();
    }

    return () => {
      controller.abort();
      if (expirationTimer) {
        clearTimeout(expirationTimer);
      }
      window.removeEventListener(
        AUTHENTICATION_FAILURE_EVENT,
        handleAuthenticationFailure,
      );
      document.removeEventListener("visibilitychange", expireIfNeeded);
    };
  }, [verificationAttempt]);

  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f9fc] px-5">
        {verificationError ? (
          <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
            <AlertCircle className="mx-auto size-7 text-red-600" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-slate-800">
              {verificationError}
            </p>
            <button
              type="button"
              onClick={() => setVerificationAttempt((attempt) => attempt + 1)}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <RotateCw className="size-4" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
            <Loader2 className="size-5 animate-spin text-blue-600" aria-hidden="true" />
            Verifying your session...
          </div>
        )}
      </main>
    );
  }

  if (page === "dashboard") return <AdminOverview admin={session} />;
  if (page === "activity-logs") return <ActivityLogsPage admin={session} />;
  return <SitemapDashboard admin={session} />;
}
