import { NextRequest } from "next/server";
import { requireUser } from "@/server/auth/guard";
import { toPublicUser } from "@/server/auth/public-user";
import { ok, route } from "@/server/http";

/** GET /api/profile — the signed-in user's public profile. */
export const GET = route(async (req: NextRequest) => {
  const user = await requireUser(req);
  return ok(toPublicUser(user), { headers: { "cache-control": "no-store" } });
});
