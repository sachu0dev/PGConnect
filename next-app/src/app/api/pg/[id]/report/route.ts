import { route, ok, readJson, badRequest, conflict, notFound } from "@/server/http";
import { requireUser } from "@/server/auth/guard";
import { enforceRateLimit } from "@/server/rate-limit";
import { getPgAccess } from "@/server/engagement";
import { reportSchema } from "@/lib/validation";
import prisma from "@/lib/prisma";
import type { ReportReason } from "@prisma/client";

/** Flag a listing for moderation. One report per user per listing. */
export const POST = route<{ id: string }>(async (req, { params }) => {
  const { id } = await params;
  const user = await requireUser(req);
  enforceRateLimit(`report:${user.id}`, 10, 60 * 60 * 1000);
  const input = reportSchema.parse(await readJson(req));

  const pg = await getPgAccess(id);
  if (!pg) throw notFound("PG not found");
  if (pg.ownerId === user.id) throw badRequest("You cannot report your own listing");

  const existing = await prisma.report.findUnique({
    where: { pgId_userId: { pgId: pg.id, userId: user.id } },
    select: { id: true },
  });
  if (existing) throw conflict("You have already reported this listing");

  const report = await prisma.report.create({
    data: {
      pgId: pg.id,
      userId: user.id,
      reason: input.reason as ReportReason,
      details: input.details,
    },
    select: { id: true, reason: true, status: true },
  });
  return ok({ report }, 201);
});
