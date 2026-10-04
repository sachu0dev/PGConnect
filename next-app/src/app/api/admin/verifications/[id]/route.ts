import prisma from "@/lib/prisma";
import { requireUser } from "@/server/auth/guard";
import {
  findVerification,
  parseId,
  toAdminVerification,
  verificationDecisionSchema,
} from "@/server/admin";
import { env } from "@/server/env";
import { sendEmail } from "@/server/email/send";
import { VerificationDecisionEmail } from "@/server/email/templates";
import { enforceRateLimit } from "@/server/rate-limit";
import { notFound, ok, readJson, route } from "@/server/http";

export const dynamic = "force-dynamic";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const admin = await requireUser(req, { admin: true });
  enforceRateLimit(`admin:verify:${admin.id}`, 120, 60_000);
  const id = parseId((await params).id, "Verification request");
  const input = verificationDecisionSchema.parse(await readJson(req));

  const existing = await findVerification(id);
  if (!existing) throw notFound("Verification request not found");

  await prisma.ownerVerification.update({
    where: { id },
    data: { status: input.status, reviewNote: input.note, reviewedAt: new Date() },
  });
  const updated = await findVerification(id);
  if (!updated) throw notFound("Verification request not found");

  const approved = input.status === "APPROVED";
  await sendEmail(
    updated.user.email,
    approved ? "You're now a verified owner on PGConnect" : "Update on your PGConnect owner verification",
    VerificationDecisionEmail({
      name: updated.fullName || updated.user.username,
      approved,
      note: input.note,
      url: `${env.siteUrl}/dashboard/verify-owner`,
    }),
    `verification=${input.status}`
  );

  return ok(toAdminVerification(updated));
});
