import { z } from "zod";
import { route, ok, readJson, getClientIp } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import prisma from "@/lib/prisma";

const bodySchema = z.object({
  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(60)
    .transform((c) => c.toLowerCase()),
});

/** Returns how many active listings a city has (used while posting a PG). */
export const POST = route(async (req) => {
  enforceRateLimit(`check-city:${getClientIp(req)}`, 60, 60 * 1000);
  const { city } = bodySchema.parse(await readJson(req));
  const listings = await prisma.pg.count({ where: { status: "ACTIVE", city } });
  return ok({ city, listings });
});
