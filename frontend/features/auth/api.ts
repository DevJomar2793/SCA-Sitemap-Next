import { requestJson } from "@/lib/api-client";

import type { AdminUser, LoginCredentials, RegistrationDetails } from "./types";

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

export function getCurrentAdmin(signal?: AbortSignal): Promise<AdminUser> {
  return requestJson<AdminUser>("/auth/me", { signal });
}

export function logout(): Promise<void> {
  return requestJson<void>("/auth/logout", { method: "POST" });
}
