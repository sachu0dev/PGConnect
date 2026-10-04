import prisma from "@/lib/prisma";
import { ownerVerificationSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guard";
import { badRequest, conflict, ok, route } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limit";
import { deletePrivateDocument, uploadPrivateDocument } from "@/server/storage";

export const dynamic = "force-dynamic";

const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

const verificationSelect = {
  status: true,
  documentType: true,
  documentLast4: true,
  reviewNote: true,
  createdAt: true,
  reviewedAt: true,
} as const;

/** My owner verification request, or null. */
export const GET = route(async (req) => {
  const user = await requireUser(req);
  const verification = await prisma.ownerVerification.findUnique({
    where: { userId: user.id },
    select: verificationSelect,
  });
  return ok(verification);
});

/**
 * Submit (or resubmit after rejection) an ID document for the "Verified owner"
 * badge. multipart: fullName, documentType, documentLast4, document (file).
 * Only the last 4 characters of the document number are ever accepted/stored.
 */
export const POST = route(async (req) => {
  const user = await requireUser(req);
  enforceRateLimit(`verify-owner:${user.id}`, 5, 60 * 60 * 1000);

  const form = await req.formData().catch(() => {
    throw badRequest("Send the verification form as multipart form data");
  });
  const fields = ownerVerificationSchema.parse({
    fullName: form.get("fullName") ?? undefined,
    documentType: form.get("documentType") ?? undefined,
    documentLast4: form.get("documentLast4") ?? undefined,
  });
  const document = form.get("document");
  if (!(document instanceof File) || document.size === 0) {
    throw badRequest("Upload a photo or PDF of your document");
  }
  if (document.size > MAX_DOCUMENT_BYTES) throw badRequest("The document must be under 8 MB");

  const existing = await prisma.ownerVerification.findUnique({
    where: { userId: user.id },
    select: { status: true, documentKey: true },
  });
  if (existing?.status === "PENDING") {
    throw conflict("Your verification is already under review. We'll email you once it's done.");
  }
  if (existing?.status === "APPROVED") throw conflict("You're already a verified owner.");

  const documentKey = await uploadPrivateDocument(document, user.id);
  const data = {
    fullName: fields.fullName,
    documentType: fields.documentType,
    documentLast4: fields.documentLast4.toUpperCase(),
    documentKey,
    status: "PENDING" as const,
    reviewNote: null,
    reviewedAt: null,
    createdAt: new Date(),
  };

  let verification;
  try {
    [verification] = await prisma.$transaction([
      prisma.ownerVerification.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...data },
        update: data,
        select: verificationSelect,
      }),
      prisma.user.update({ where: { id: user.id }, data: { isOwner: true } }),
    ]);
  } catch (error) {
    await deletePrivateDocument(documentKey);
    throw error;
  }

  if (existing?.documentKey) await deletePrivateDocument(existing.documentKey);
  return ok(verification, 201);
});
