import { endSession } from "@/server/auth/session";
import { ok, route } from "@/server/http";

/** POST /api/auth/logout — revokes the current session. Always succeeds. */
export const POST = route(async () => {
  try {
    await endSession();
  } catch (error) {
    console.error("[auth] logout failed", error);
  }
  return ok({ loggedOut: true });
});
