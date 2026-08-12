const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000/api/v1";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export const AUTHENTICATION_FAILURE_EVENT = "sca:authentication-failure";

export type AuthenticationFailureReason = "expired" | "invalid";

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  return readResponse<T>(response);
}

export async function requestFormData<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  return readResponse<T>(response);
}

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await readError(response);
    notifyAuthenticationFailure(response.status, error.code);
    throw new ApiRequestError(error.message, response.status, error.code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function readError(
  response: Response,
): Promise<{ message: string; code?: string }> {
  const fallback = `Request failed with status ${response.status}`;

  try {
    return getErrorDetails(await response.json(), fallback);
  } catch {
    return { message: fallback };
  }
}

function getErrorDetails(
  payload: unknown,
  fallback: string,
): { message: string; code?: string } {
  if (!payload || typeof payload !== "object" || !("detail" in payload)) {
    return { message: fallback };
  }

  const detail = payload.detail;
  if (typeof detail === "string") {
    return { message: detail };
  }

  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    const message = "message" in detail ? detail.message : null;
    const code = "code" in detail ? detail.code : null;
    return {
      message: typeof message === "string" ? message : fallback,
      code: typeof code === "string" ? code : undefined,
    };
  }

  if (!Array.isArray(detail)) {
    return { message: fallback };
  }

  const messages = detail
    .map((item) => {
      if (item && typeof item === "object" && "msg" in item) {
        return String(item.msg);
      }
      return null;
    })
    .filter(Boolean);

  return { message: messages.length > 0 ? messages.join(". ") : fallback };
}

function notifyAuthenticationFailure(status: number, code?: string): void {
  if (status !== 401 || code === "incorrect_credentials") {
    return;
  }

  const reason: AuthenticationFailureReason =
    code === "session_expired" ? "expired" : "invalid";

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<AuthenticationFailureReason>(
        AUTHENTICATION_FAILURE_EVENT,
        { detail: reason },
      ),
    );
  }
}
