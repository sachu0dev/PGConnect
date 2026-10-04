import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/server/auth/guard";
import { parseId } from "@/server/admin";
import { notFound, ok, route } from "@/server/http";
import { getPrivateDocument } from "@/server/storage";

export const dynamic = "force-dynamic";

const EXT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * Streams a private ID document to admins. Never cached, never public.
 * With S3 the response is a 307 to a 5-minute signed URL; `?mode=url` returns
 * that URL as JSON instead, so browser clients can open it without CORS.
 */
export const GET = route<{ id: string }>(async (req, { params }) => {
  await requireUser(req, { admin: true });
  const id = parseId((await params).id, "Verification request");

  const verification = await prisma.ownerVerification.findUnique({
    where: { id },
    select: { documentKey: true },
  });
  if (!verification?.documentKey) throw notFound("No document on file for this request");

  let doc: Awaited<ReturnType<typeof getPrivateDocument>>;
  try {
    doc = await getPrivateDocument(verification.documentKey);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw notFound("The document file is no longer available");
    }
    throw error;
  }

  const headers = {
    "cache-control": "no-store, private",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
  };

  if ("redirect" in doc) {
    if (new URL(req.url).searchParams.get("mode") === "url") {
      const ext = verification.documentKey.split(".").pop()?.toLowerCase() ?? "";
      return ok(
        { url: doc.redirect, contentType: EXT_TYPES[ext] ?? "application/octet-stream" },
        { headers }
      );
    }
    return NextResponse.redirect(doc.redirect, { status: 307, headers });
  }

  return new NextResponse(new Uint8Array(doc.buffer), {
    status: 200,
    headers: {
      ...headers,
      "content-type": doc.contentType,
      "content-disposition": "inline",
      "content-length": String(doc.buffer.length),
    },
  });
});
