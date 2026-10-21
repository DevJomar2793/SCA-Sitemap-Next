import { requestJson } from "@/lib/api-client";

import type {
  AdminSession,
  AdminUser,
  LoginCredentials,
  RegistrationDetails,
} from "./types";

const AUTH_ADMIN_STORAGE_KEY = "sca_authenticated_admin";

export function login(credentials: LoginCredentials): Promise<AdminSession> {
  return requestJson<AdminSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function getSession(signal?: AbortSignal): Promise<AdminSession> {
  return requestJson<AdminSession>("/auth/session", { signal });
}

export function register(
  registration: RegistrationDetails,
): Promise<AdminUser> {
  return requestJson<AdminUser>("/auth/register", {
    method: "POST",
    body: JSON.stringify(registration),
  });
}

export function storeAuthenticatedSession(session: AdminSession): void {
  window.sessionStorage.setItem(AUTH_ADMIN_STORAGE_KEY, JSON.stringify(session));
}

export function getStoredAuthenticatedSession(): AdminSession | null {
  const storedSession = window.sessionStorage.getItem(AUTH_ADMIN_STORAGE_KEY);
  if (!storedSession) {
    return null;
  }

  try {
    const session = JSON.parse(storedSession) as Partial<AdminSession>;
    return typeof session.expires_at === "string"
      ? (session as AdminSession)
      : null;
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
