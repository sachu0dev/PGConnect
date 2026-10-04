import { z } from "zod";
import { requireUser } from "@/server/auth/guard";
import { badRequest, ok, readJson, route } from "@/server/http";
import { addListingImages, removeListingImage, reorderListingImages } from "@/server/owner";

const pgId = z.string().uuid("Invalid listing id");

/** Add photos: multipart { pgId, images[] }. */
export const POST = route(async (req) => {
  const user = await requireUser(req, { owner: true });
  const form = await req.formData().catch(() => {
    throw badRequest("Send photos as multipart form data");
  });
  const id = pgId.parse(form.get("pgId"));
  const files = form.getAll("images").filter((v): v is File => typeof v !== "string");
  return ok(await addListingImages(user, id, files));
});

/** Remove a photo: JSON { pgId, imageUrl }. */
export const DELETE = route(async (req) => {
  const user = await requireUser(req, { owner: true });
  const body = z
    .object({ pgId, imageUrl: z.string().min(1).max(2048) })
    .parse(await readJson(req));
  return ok(await removeListingImage(user, body.pgId, body.imageUrl));
});

/** Reorder / set cover: JSON { pgId, images } (exact permutation of current photos). */
export const PUT = route(async (req) => {
  const user = await requireUser(req, { owner: true });
  const body = z
    .object({ pgId, images: z.array(z.string().min(1).max(2048)).max(50) })
    .parse(await readJson(req));
  return ok(await reorderListingImages(user, body.pgId, body.images));
});
