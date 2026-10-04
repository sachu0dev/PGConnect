import { route, ok, notFound } from "@/server/http";
import { getListingDetail } from "@/server/listings";
import { optionalUser } from "@/server/auth/guard";
import prisma from "@/lib/prisma";

/**
 * Public listing detail. Only ACTIVE listings are public; the owner (and
 * admins) can also load their PAUSED / BLOCKED listing.
 */
export const GET = route<{ id: string }>(async (req, { params }) => {
  const { id } = await params;
  if (id.length > 64) throw notFound("PG not found");

  const [pg, ownerBanned] = await Promise.all([
    getListingDetail(id),
    prisma.pg.count({ where: { id, owner: { isBanned: true } } }),
  ]);
  if (!pg) throw notFound("PG not found");

  if (pg.status !== "ACTIVE" || ownerBanned > 0) {
    const viewer = await optionalUser(req);
    const allowed = viewer && (viewer.id === pg.owner.id || viewer.isAdmin);
    if (!allowed) throw notFound("PG not found");
  }
  return ok(pg);
});
