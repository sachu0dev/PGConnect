import { NextRequest } from "next/server";
import { route } from "@/server/http";
import { readLocalPublicImage } from "@/server/storage";

/** Serves listing photos stored by the local storage driver. */
export const GET = route<{ path: string[] }>(async (_req: NextRequest, { params }) => {
  const { path } = await params;
  const { buffer, contentType } = await readLocalPublicImage(path.map(decodeURIComponent).join("/"));
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
});
