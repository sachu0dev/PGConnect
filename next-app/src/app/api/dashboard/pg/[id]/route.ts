import { requireUser } from "@/server/auth/guard";
import { ok, readJson, route } from "@/server/http";
import { deleteListing, getEditableListing, updateListing } from "@/server/owner";

export const dynamic = "force-dynamic";

type Params = { id: string };

export const GET = route<Params>(async (req, { params }) => {
  const user = await requireUser(req, { owner: true });
  const { id } = await params;
  return ok(await getEditableListing(user, id));
});

export const PATCH = route<Params>(async (req, { params }) => {
  const user = await requireUser(req, { owner: true });
  const { id } = await params;
  return ok(await updateListing(user, id, await readJson(req)));
});

export const DELETE = route<Params>(async (req, { params }) => {
  const user = await requireUser(req, { owner: true });
  const { id } = await params;
  return ok(await deleteListing(user, id));
});
