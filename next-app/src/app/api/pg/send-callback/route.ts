import { z } from "zod";
import { route, ok, readJson } from "@/server/http";
import { requireUser } from "@/server/auth/guard";
import { submitLead } from "@/server/leads";
import { leadSchema } from "@/lib/validation";

const legacyBodySchema = z.object({
  pgId: z.string().trim().min(1, "pgId is required").max(64),
  PhoneNumber: z.string().optional(),
  phoneNumber: z.string().optional(),
  name: z.string().optional(),
  message: z.string().optional(),
});

/**
 * Legacy adapter kept for old clients. Prefer `POST /api/pg/[id]/leads`.
 * Body: { pgId, PhoneNumber | phoneNumber, name?, message? }
 */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  const body = legacyBodySchema.parse(await readJson(req));
  const input = leadSchema.parse({
    type: "CALLBACK",
    name: body.name?.trim() || user.username,
    phoneNumber: body.phoneNumber ?? body.PhoneNumber ?? "",
    message: body.message,
  });
  return ok(await submitLead(user, body.pgId, input), 201);
});
