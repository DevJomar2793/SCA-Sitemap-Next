import { requestJson } from "@/lib/api-client";

import type { AdminUser, LoginCredentials, RegistrationDetails } from "./types";

const AUTH_ADMIN_STORAGE_KEY = "sca_authenticated_admin";

export function login(credentials: LoginCredentials): Promise<AdminUser> {
  return requestJson<AdminUser>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function register(
  registration: RegistrationDetails,
): Promise<AdminUser> {
  return requestJson<AdminUser>("/auth/register", {
    method: "POST",
    body: JSON.stringify(registration),
  });
}

export function storeAuthenticatedAdmin(admin: AdminUser): void {
  window.sessionStorage.setItem(AUTH_ADMIN_STORAGE_KEY, JSON.stringify(admin));
}

export function getStoredAuthenticatedAdmin(): AdminUser | null {
  const storedAdmin = window.sessionStorage.getItem(AUTH_ADMIN_STORAGE_KEY);
  if (!storedAdmin) {
    return null;
  }

  try {
    return JSON.parse(storedAdmin) as AdminUser;
  } catch {
    window.sessionStorage.removeItem(AUTH_ADMIN_STORAGE_KEY);
    return null;
  }
}

export function clearStoredAuthenticatedAdmin(): void {
  window.sessionStorage.removeItem(AUTH_ADMIN_STORAGE_KEY);
}

export function logout(): Promise<void> {
  return requestJson<void>("/auth/logout", { method: "POST" });
}
