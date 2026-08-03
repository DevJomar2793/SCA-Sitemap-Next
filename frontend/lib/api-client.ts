const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:8000/api/v1";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

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
    throw new ApiRequestError(
      await readErrorMessage(response),
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    return getErrorMessage(
      await response.json(),
      `Request failed with status ${response.status}`,
    );
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object" || !("detail" in payload)) {
    return fallback;
  }

  const detail = payload.detail;
  if (typeof detail === "string") {
    return detail;
  }

  if (!Array.isArray(detail)) {
    return fallback;
  }

  const messages = detail
    .map((item) => {
      if (item && typeof item === "object" && "msg" in item) {
        return String(item.msg);
      }
      return null;
    })
    .filter(Boolean);

  return messages.length > 0 ? messages.join(". ") : fallback;
}
