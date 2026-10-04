"use client";

/**
 * Tiny fetch wrapper used by every client component.
 * - keeps the short-lived access token in memory only (never localStorage)
 * - transparently refreshes it once on 401 using the httpOnly refresh cookie
 * - unwraps the `{ success, data, error }` envelope returned by our API
 */

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
const listeners = new Set<(token: string | null) => void>();

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  listeners.forEach((listener) => listener(token));
}

export function onAccessTokenChange(listener: (token: string | null) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= fetch("/api/auth/refresh", { method: "POST", credentials: "include" })
    .then(async (res) => {
      if (!res.ok) return null;
      const json = await res.json();
      return (json?.data?.accessToken as string | undefined) ?? null;
    })
    .catch(() => null)
    .then((token) => {
      setAccessToken(token);
      return token;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}${path.includes("?") ? "&" : "?"}${qs}` : path;
}

async function send(path: string, options: RequestOptions, token: string | null) {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(options.body);
  }
  if (token) headers.authorization = `Bearer ${token}`;

  return fetch(buildUrl(path, options.query), {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    headers,
    body,
    credentials: "include",
    signal: options.signal,
  });
}

export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  let res = await send(path, options, accessToken);

  if (res.status === 401 && !path.startsWith("/api/auth/")) {
    const token = await refreshAccessToken();
    if (token) res = await send(path, options, token);
  }

  let json: { success?: boolean; data?: T; error?: string; details?: unknown } | null = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok || !json?.success) {
    throw new ApiClientError(
      res.status,
      json?.error ?? (res.status >= 500 ? "Server error. Please try again." : "Request failed"),
      json?.details
    );
  }
  return json.data as T;
}

export function errorMessage(error: unknown, fallback = "Something went wrong") {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error && error.name !== "AbortError") return error.message || fallback;
  return fallback;
}
