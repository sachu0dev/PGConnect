import { revalidatePath } from "next/cache";
import { requireUser } from "@/server/auth/guard";
import { parseId, listingStatusSchema, setListingStatus } from "@/server/admin";
import { ok, readJson, route } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  const admin = await requireUser(req, { admin: true });
  enforceRateLimit(`admin:pg:${admin.id}`, 120, 60_000);
  const id = parseId((await params).id, "Listing");
  const { status } = listingStatusSchema.parse(await readJson(req));
  const listing = await setListingStatus(id, status);
  // Drop any cached public page for this listing so a block takes effect immediately.
  revalidatePath(`/pg/${id}`);
  return ok(listing);
});
