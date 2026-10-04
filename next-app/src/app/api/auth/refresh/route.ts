import { refreshSession } from "@/server/auth/session";
import { ok, route } from "@/server/http";

/**
 * POST /api/auth/refresh — issues a new access token from the refresh cookie.
 * Response: { accessToken: string | null }. Guests get `null` (not a 401) so
 * every anonymous page view doesn't log a failed request in the console.
 */
export const POST = route(async () => {
  const session = await refreshSession();
  return ok({ accessToken: session?.accessToken ?? null }, { headers: { "cache-control": "no-store" } });
});
