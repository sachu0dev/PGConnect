import { requireUser } from "@/server/auth/guard";
import { badRequest, ok, route } from "@/server/http";
import { createListing } from "@/server/owner";

/**
 * Create a listing. multipart/form-data with listingSchema fields
 * (sharingTypes / amenities as JSON strings or repeated fields) + images[].
 */
export const POST = route(async (req) => {
  const user = await requireUser(req, { owner: true });
  const form = await req.formData().catch(() => {
    throw badRequest("Send the listing as multipart form data");
  });
  const pg = await createListing(user, form);
  return ok(pg, 201);
});
