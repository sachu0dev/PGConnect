import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { profileSchema } from "@/lib/validation";
import { features } from "@/server/env";
import { ApiError, badRequest, ok, readJson, route } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { loadAuthUser, requireUser } from "@/server/auth/guard";
import { toPublicUser } from "@/server/auth/public-user";
import { endSession } from "@/server/auth/session";
import { deleteListingImage, deletePrivateDocument } from "@/server/storage";
import { razorpay } from "@/server/payments";
import { MINUTE, checkPassword, findUsernameOwner } from "../auth/_lib/helpers";

/** PATCH /api/account — update { username?, phoneNumber? } → PublicUser. */
export const PATCH = route(async (req: NextRequest) => {
  const user = await requireUser(req);
  enforceRateLimit(`account:update:${user.id}`, 20, 10 * MINUTE);
  const body = profileSchema.parse(await readJson(req));

  const data: { username?: string; phoneNumber?: string | null } = {};
  if (body.username !== undefined && body.username !== user.username) {
    const owner = await findUsernameOwner(body.username);
    if (owner && owner.id !== user.id) {
      throw new ApiError(409, "This username is already taken. Try another one.", {
        username: ["This username is already taken"],
      });
    }
    data.username = body.username;
  }
  if (body.phoneNumber !== undefined) data.phoneNumber = body.phoneNumber;

  if (Object.keys(data).length > 0) {
    await prisma.user.update({ where: { id: user.id }, data });
  }
  const updated = await loadAuthUser(user.id);
  return ok(toPublicUser(updated ?? user));
});

const deleteSchema = z.object({
  confirm: z.literal("DELETE", { errorMap: () => ({ message: 'Type "DELETE" to confirm' }) }),
  password: z.string().max(72).optional(),
});

const OPEN_SUBSCRIPTION_STATES = ["CREATED", "PENDING", "AUTHENTICATED", "ACTIVE"];

/**
 * DELETE /api/account — permanently deletes the signed-in account.
 * Body: { confirm: "DELETE", password? } (password required when the account has one).
 */
export const DELETE = route(async (req: NextRequest) => {
  const user = await requireUser(req);
  enforceRateLimit(`account:delete:${user.id}`, 5, 15 * MINUTE);
  const body = deleteSchema.parse(await readJson(req));

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      password: true,
      Pg: { select: { images: true } },
      verification: { select: { documentKey: true } },
      Subscription: { select: { razorpaySubscriptionId: true, status: true } },
    },
  });
  if (!record) throw badRequest("Account not found");

  if (record.password) {
    if (!body.password) throw badRequest("Enter your password to confirm", { password: ["Password is required"] });
    if (!(await checkPassword(body.password, record.password))) {
      throw badRequest("Incorrect password", { password: ["Incorrect password"] });
    }
  }

  // Stop any recurring billing before the subscription rows disappear.
  if (features.payments) {
    const open = record.Subscription.filter((s) => OPEN_SUBSCRIPTION_STATES.includes(s.status.toUpperCase()));
    for (const sub of open) {
      try {
        await razorpay().subscriptions.cancel(sub.razorpaySubscriptionId, false);
      } catch (error) {
        console.error("[account] failed to cancel subscription on delete", error);
      }
    }
  }

  await prisma.user.delete({ where: { id: user.id } });

  const images = record.Pg.flatMap((pg) => pg.images);
  await Promise.all(images.map((url) => deleteListingImage(url)));
  if (record.verification?.documentKey) await deletePrivateDocument(record.verification.documentKey);

  await endSession();
  return ok({ deleted: true });
});
