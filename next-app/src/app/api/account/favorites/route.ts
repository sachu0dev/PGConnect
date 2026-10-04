import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ok, route } from "@/server/http";
import { requireUser } from "@/server/auth/guard";
import { pgCardSelect, toPgCard } from "@/server/listings";

/** GET /api/account/favorites — the user's shortlisted, currently active PGs (newest first) → PgCard[]. */
export const GET = route(async (req: NextRequest) => {
  const user = await requireUser(req);
  const rows = await prisma.favorite.findMany({
    where: { userId: user.id, pg: { status: "ACTIVE" } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { pg: { select: pgCardSelect } },
  });
  return ok(
    rows.map((row) => toPgCard(row.pg)),
    { headers: { "cache-control": "no-store" } }
  );
});
