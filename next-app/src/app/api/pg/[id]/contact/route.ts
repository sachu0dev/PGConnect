import { route, ok } from "@/server/http";
import { requireUser } from "@/server/auth/guard";
import { enforceRateLimit } from "@/server/rate-limit";
import { requireInteractablePg } from "@/server/engagement";
import prisma from "@/lib/prisma";
import type { ContactInfo } from "@/components/listing/types";

/** Reveals the owner's phone number to signed-in users (rate limited). */
export const GET = route<{ id: string }>(async (req, { params }) => {
  const { id } = await params;
  const user = await requireUser(req);
  enforceRateLimit(`contact:${user.id}`, 20, 60 * 60 * 1000);

  const pg = await requireInteractablePg(id);
  const row = await prisma.pg.findUniqueOrThrow({ where: { id: pg.id }, select: { contact: true } });
  const digits = row.contact.replace(/\D/g, "").slice(-10);
  const text = `Hi, I found ${pg.name} on PGConnect and I'm interested.`;
  const data: ContactInfo = {
    phone: `+91${digits}`,
    whatsappUrl: `https://wa.me/91${digits}?text=${encodeURIComponent(text)}`,
  };
  return ok(data, { headers: { "cache-control": "private, no-store" } });
});
