"use client";

import {
  AlertCircle,
  Check,
  Loader2,
  RotateCw,
  UserCog,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AdminShell } from "@/components/layout/admin-shell";
import type { AdminUser } from "@/features/auth/types";

import { approveAccount, getAccounts, rejectAccount } from "../api";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
});

const STATUS_STYLES: Record<AdminUser["approval_status"], string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
};

export function AccountPermissionsPage({ admin }: { admin: AdminUser }) {
  const [accounts, setAccounts] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [updatingAccountId, setUpdatingAccountId] = useState<number | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadAccounts() {
      setIsLoading(true);
      setError("");

      try {
        setAccounts(await getAccounts(controller.signal));
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load accounts.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadAccounts();
    return () => controller.abort();
  }, [loadAttempt]);

  function replaceAccount(updatedAccount: AdminUser) {
    setAccounts((current) =>
      current.map((account) =>
        account.id === updatedAccount.id ? updatedAccount : account,
      ),
    );
  }

  async function handleApprove(account: AdminUser) {
    setUpdatingAccountId(account.id);
    setError("");
    setSuccessMessage("");

    try {
      replaceAccount(await approveAccount(account.id));
      setSuccessMessage(`${account.full_name} can now sign in.`);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to approve the account.",
      );
    } finally {
      setUpdatingAccountId(null);
    }
  }

  async function handleReject(account: AdminUser) {
    const confirmed = window.confirm(
      `Permanently reject ${account.full_name}? This decision cannot be changed.`,
    );
    if (!confirmed) return;

    setUpdatingAccountId(account.id);
    setError("");
    setSuccessMessage("");

    try {
      replaceAccount(await rejectAccount(account.id));
      setSuccessMessage(`${account.full_name}'s registration was rejected.`);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to reject the account.",
      );
    } finally {
      setUpdatingAccountId(null);
    }
  }

  return (
    <AdminShell
      admin={admin}
      title="Account Permissions"
      section="Administration"
      appearance="finder"
    >
      <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-7 lg:px-9 lg:py-7">
        <div className="mb-6">
          <p className="text-sm font-semibold text-sky-300">Administrator access</p>
          <h2 className="mt-1 text-2xl font-bold tracking-[-0.025em] text-white">
            Review registered accounts
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-blue-100">
            Approved administrators can sign in. Rejected registrations cannot
            be approved later.
          </p>
        </div>

        {error ? (
          <div role="alert" className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setLoadAttempt((value) => value + 1)} className="inline-flex items-center gap-1.5 font-bold hover:text-red-900">
              <RotateCw className="size-4" aria-hidden="true" /> Retry
            </button>
          </div>
        ) : null}

        {successMessage ? (
          <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {successMessage}
          </p>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-blue-200/80 bg-white shadow-[0_18px_45px_rgba(0,13,45,0.2)]">
          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-semibold text-slate-600">
              <Loader2 className="size-5 animate-spin text-blue-600" aria-hidden="true" />
              Loading accounts...
            </div>
          ) : accounts.length === 0 ? (
            <div className="grid min-h-64 place-items-center px-6 text-center">
              <div>
                <UserCog className="mx-auto size-9 text-slate-400" aria-hidden="true" />
                <p className="mt-3 font-semibold text-slate-700">No accounts found.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-225 border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold uppercase tracking-[0.04em] text-slate-500">
                    <th className="px-5 py-4">Account</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Registered</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700">
                  {accounts.map((account) => {
                    const isUpdating = updatingAccountId === account.id;
                    return (
                      <tr key={account.id} className="border-t border-slate-200">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{account.full_name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{account.email}</p>
                        </td>
                        <td className="px-5 py-4 capitalize">{account.role}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {DATE_FORMATTER.format(new Date(account.created_at))}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-lg px-2.5 py-1.5 text-xs font-bold capitalize ring-1 ring-inset ${STATUS_STYLES[account.approval_status]}`}>
                            {account.approval_status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {account.approval_status === "pending" ? (
                            <div className="flex justify-end gap-2">
                              <button type="button" disabled={updatingAccountId !== null} onClick={() => void handleApprove(account)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60">
                                {isUpdating ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Check className="size-4" aria-hidden="true" />}
                                Approve
                              </button>
                              <button type="button" disabled={updatingAccountId !== null} onClick={() => void handleReject(account)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-wait disabled:opacity-60">
                                <X className="size-4" aria-hidden="true" /> Reject
                              </button>
                            </div>
                          ) : (
                            <p className="text-right text-xs text-slate-400">No actions available</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
