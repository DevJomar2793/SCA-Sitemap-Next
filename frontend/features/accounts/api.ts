import type { AdminUser } from "@/features/auth/types";
import { requestJson } from "@/lib/api-client";

export function getAccounts(signal?: AbortSignal): Promise<AdminUser[]> {
  return requestJson<AdminUser[]>("/accounts", { signal });
}

export function approveAccount(accountId: number): Promise<AdminUser> {
  return requestJson<AdminUser>(`/accounts/${accountId}/approve`, {
    method: "PATCH",
  });
}

export function rejectAccount(accountId: number): Promise<AdminUser> {
  return requestJson<AdminUser>(`/accounts/${accountId}/reject`, {
    method: "PATCH",
  });
}
