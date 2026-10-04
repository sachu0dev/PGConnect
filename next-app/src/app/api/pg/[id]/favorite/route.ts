import { route, ok, notFound } from "@/server/http";
import { requireUser } from "@/server/auth/guard";
import { enforceRateLimit } from "@/server/rate-limit";
import { getPgAccess } from "@/server/engagement";
import prisma from "@/lib/prisma";

/** Add a PG to the signed-in user's shortlist. */
export const POST = route<{ id: string }>(async (req, { params }) => {
  const { id } = await params;
  const user = await requireUser(req);
  enforceRateLimit(`favorite:${user.id}`, 120, 60 * 60 * 1000);
  const pg = await getPgAccess(id);
  if (!pg || pg.status === "BLOCKED" || pg.ownerBanned) throw notFound("PG not found");
  await prisma.favorite.upsert({
    where: { userId_pgId: { userId: user.id, pgId: pg.id } },
    create: { userId: user.id, pgId: pg.id },
    update: {},
  });
  return ok({ saved: true });
});

/** Remove a PG from the shortlist. */
export const DELETE = route<{ id: string }>(async (req, { params }) => {
  const { id } = await params;
  const user = await requireUser(req);
  const pg = await getPgAccess(id);
  if (!pg) throw notFound("PG not found");
  await prisma.favorite.deleteMany({ where: { userId: user.id, pgId: pg.id } });
  return ok({ saved: false });
});
