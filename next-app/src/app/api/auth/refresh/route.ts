import { refreshSession } from "@/server/auth/session";
import { ok, route, unauthorized } from "@/server/http";

/** POST /api/auth/refresh — rotates the access token using the refresh cookie. Response: { accessToken }. */
export const POST = route(async () => {
  const session = await refreshSession();
  if (!session) throw unauthorized("Your session has expired. Please log in again.");
  return ok({ accessToken: session.accessToken }, { headers: { "cache-control": "no-store" } });
});
