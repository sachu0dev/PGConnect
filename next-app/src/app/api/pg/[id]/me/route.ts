import { route, ok, notFound } from "@/server/http";
import { optionalUser } from "@/server/auth/guard";
import { getPgAccess, getViewerState } from "@/server/engagement";

/** Viewer-specific state for a listing page. Guests get everything false. */
export const GET = route<{ id: string }>(async (req, { params }) => {
  const { id } = await params;
  const [pg, user] = await Promise.all([getPgAccess(id), optionalUser(req)]);
  if (!pg) throw notFound("PG not found");
  const state = await getViewerState(pg, user);
  return ok(state, { headers: { "cache-control": "private, no-store" } });
});
