import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiClientError } from "@/lib/api-client";

const AUTH_PATHS = ["/login", "/register", "/verify", "/forgot-password", "/reset-password"];

/**
 * Returns a safe same-origin redirect target from a `?next=` value, falling
 * back to "/" for anything that could leave the site (absolute URLs, "//host",
 * backslash tricks) or loop back into the auth pages.
 */
export function safeNext(value: string | null | undefined, fallback = "/"): string {
  if (!value) return fallback;
  const target = value.trim();
  let decoded: string;
  try {
    decoded = decodeURIComponent(target);
  } catch {
    decoded = target;
  }
  for (const candidate of [target, decoded]) {
    if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) return fallback;
    if (/[\u0000-\u001f]/.test(candidate)) return fallback;
  }
  const path = target.split(/[?#]/)[0] ?? "";
  if (AUTH_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return fallback;
  return target;
}

/** Builds an auth page URL that carries `next` (only when it is not the default). */
export function authHref(path: string, next: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams(extra);
  if (next && next !== "/") params.set("next", next);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Maps `{ field: [message] }` details from an API error onto react-hook-form fields. */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[]
): boolean {
  if (!(error instanceof ApiClientError) || !error.details || typeof error.details !== "object") return false;
  let applied = false;
  const details = error.details as Record<string, unknown>;
  for (const field of fields) {
    const messages = details[field as string];
    if (Array.isArray(messages) && typeof messages[0] === "string") {
      setError(field, { type: "server", message: messages[0] }, { shouldFocus: !applied });
      applied = true;
    }
  }
  return applied;
}

/** Reads a typed flag from an API error's details payload. */
export function errorDetail(error: unknown, key: string): unknown {
  if (!(error instanceof ApiClientError) || !error.details || typeof error.details !== "object") return undefined;
  return (error.details as Record<string, unknown>)[key];
}
