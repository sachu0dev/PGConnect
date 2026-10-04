import "server-only";
import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { LISTING_LIMITS } from "@/lib/constants";
import { env, features } from "./env";
import { badRequest } from "./http";

const PUBLIC_PREFIX = "pg-images";
const PRIVATE_PREFIX = "private/verification";
const LOCAL_PUBLIC_DIR = path.join(process.cwd(), "public", "uploads");
const LOCAL_PRIVATE_DIR = path.join(process.cwd(), ".private-uploads");

let client: S3Client | null = null;
function s3() {
  if (!client) {
    client = new S3Client({
      region: env.aws.region!,
      credentials: {
        accessKeyId: env.aws.accessKeyId!,
        secretAccessKey: env.aws.secretAccessKey!,
      },
    });
  }
  return client;
}

function assertStorageAvailable() {
  if (!features.s3 && env.isProd) {
    throw new Error("File storage is not configured (AWS_* environment variables)");
  }
}

const SIGNATURES: { mime: string; ext: string; test: (b: Buffer) => boolean }[] = [
  { mime: "image/jpeg", ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: "image/png",
    ext: "png",
    test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: "image/webp",
    ext: "webp",
    test: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
  },
  { mime: "application/pdf", ext: "pdf", test: (b) => b.subarray(0, 5).toString("ascii") === "%PDF-" },
];

/** Detects the real type from magic bytes instead of trusting the client. */
export function sniffFileType(buffer: Buffer) {
  return SIGNATURES.find((s) => s.test(buffer)) ?? null;
}

async function readUpload(file: File, allowed: readonly string[], maxBytes: number) {
  if (!(file instanceof File) || file.size === 0) throw badRequest("Empty file upload");
  if (file.size > maxBytes) {
    throw badRequest(`Each file must be under ${Math.round(maxBytes / (1024 * 1024))} MB`);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const type = sniffFileType(buffer);
  if (!type || !allowed.includes(type.mime)) {
    throw badRequest(`Unsupported file type. Allowed: ${allowed.map((m) => m.split("/")[1]).join(", ")}`);
  }
  return { buffer, type };
}

export function publicUrlForKey(key: string) {
  if (features.s3) {
    const base =
      env.aws.publicBaseUrl ?? `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com`;
    return `${base.replace(/\/$/, "")}/${key}`;
  }
  return `/uploads/${key.replace(`${PUBLIC_PREFIX}/`, "")}`;
}

/** Returns the storage key for a URL we issued, or null for foreign URLs. */
export function keyFromPublicUrl(url: string): string | null {
  if (url.startsWith("/uploads/")) return `${PUBLIC_PREFIX}/${url.slice("/uploads/".length)}`;
  const bases = [
    env.aws.publicBaseUrl,
    env.aws.bucket && env.aws.region
      ? `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com`
      : undefined,
  ].filter(Boolean) as string[];
  for (const base of bases) {
    const prefix = `${base.replace(/\/$/, "")}/`;
    if (url.startsWith(prefix)) {
      const key = url.slice(prefix.length);
      return key.startsWith(`${PUBLIC_PREFIX}/`) && !key.includes("..") ? key : null;
    }
  }
  return null;
}

export async function uploadListingImage(file: File, ownerId: string): Promise<string> {
  assertStorageAvailable();
  const { buffer, type } = await readUpload(file, LISTING_LIMITS.imageTypes, LISTING_LIMITS.maxImageBytes);
  const key = `${PUBLIC_PREFIX}/${ownerId}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${type.ext}`;

  if (features.s3) {
    await s3().send(
      new PutObjectCommand({
        Bucket: env.aws.bucket!,
        Key: key,
        Body: buffer,
        ContentType: type.mime,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
  } else {
    const target = path.join(LOCAL_PUBLIC_DIR, key.slice(PUBLIC_PREFIX.length + 1));
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, buffer);
  }
  return publicUrlForKey(key);
}

export async function deleteListingImage(url: string): Promise<void> {
  const key = keyFromPublicUrl(url);
  if (!key) return;
  try {
    if (features.s3) {
      await s3().send(new DeleteObjectCommand({ Bucket: env.aws.bucket!, Key: key }));
    } else {
      await fs.rm(path.join(LOCAL_PUBLIC_DIR, key.slice(PUBLIC_PREFIX.length + 1)), { force: true });
    }
  } catch (error) {
    console.error("[storage] failed to delete", key, error);
  }
}

/** Uploads an identity document to private storage and returns its key. */
export async function uploadPrivateDocument(file: File, userId: string): Promise<string> {
  assertStorageAvailable();
  const { buffer, type } = await readUpload(
    file,
    ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    8 * 1024 * 1024
  );
  const key = `${PRIVATE_PREFIX}/${userId}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${type.ext}`;

  if (features.s3) {
    await s3().send(
      new PutObjectCommand({
        Bucket: env.aws.bucket!,
        Key: key,
        Body: buffer,
        ContentType: type.mime,
        ServerSideEncryption: "AES256",
      })
    );
  } else {
    const target = path.join(LOCAL_PRIVATE_DIR, key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, buffer);
  }
  return key;
}

/** Short-lived access to a private document (admins only). */
export async function getPrivateDocument(
  key: string
): Promise<{ redirect: string } | { buffer: Buffer; contentType: string }> {
  if (!key.startsWith(`${PRIVATE_PREFIX}/`) || key.includes("..")) throw badRequest("Invalid key");
  if (features.s3) {
    const url = await getSignedUrl(
      s3(),
      new GetObjectCommand({ Bucket: env.aws.bucket!, Key: key }),
      { expiresIn: 300 }
    );
    return { redirect: url };
  }
  const buffer = await fs.readFile(path.join(LOCAL_PRIVATE_DIR, key));
  return { buffer, contentType: sniffFileType(buffer)?.mime ?? "application/octet-stream" };
}

export async function deletePrivateDocument(key: string) {
  try {
    if (features.s3) {
      await s3().send(new DeleteObjectCommand({ Bucket: env.aws.bucket!, Key: key }));
    } else {
      await fs.rm(path.join(LOCAL_PRIVATE_DIR, key), { force: true });
    }
  } catch (error) {
    console.error("[storage] failed to delete private doc", error);
  }
}
