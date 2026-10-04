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
import { ApiError, badRequest, notFound } from "./http";

/**
 * Hybrid file storage. `STORAGE_DRIVER` picks where NEW files are written
 * ("local" disk by default, or "s3"). Reads and deletes work for files written
 * by either driver, so switching drivers never breaks existing listings.
 *
 * Local layout (under STORAGE_LOCAL_DIR, default ./storage):
 *   public/pg-images/<ownerId>/<file>        → served at /uploads/<ownerId>/<file>
 *   private/verification/<userId>/<file>     → never served publicly
 */

const PUBLIC_PREFIX = "pg-images";
const PRIVATE_PREFIX = "private/verification";
const LOCAL_URL_PREFIX = "/uploads/";

export function storageDriver() {
  return env.storage.driver;
}

function localRoot() {
  return path.resolve(process.cwd(), env.storage.localDir);
}

/** Resolves a key inside the local root, refusing path traversal. */
function localPath(...segments: string[]) {
  const root = localRoot();
  const target = path.resolve(root, ...segments);
  if (target !== root && !target.startsWith(root + path.sep)) throw badRequest("Invalid path");
  return target;
}

let client: S3Client | null = null;
function s3() {
  if (!features.s3) throw new ApiError(503, "S3 storage is not configured (AWS_* environment variables)");
  client ??= new S3Client({
    region: env.aws.region!,
    credentials: { accessKeyId: env.aws.accessKeyId!, secretAccessKey: env.aws.secretAccessKey! },
  });
  return client;
}

function s3PublicBase() {
  return (env.aws.publicBaseUrl ?? `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com`).replace(/\/$/, "");
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

export function publicUrlForKey(key: string, driver = storageDriver()) {
  if (driver === "s3") return `${s3PublicBase()}/${key}`;
  return `${LOCAL_URL_PREFIX}${key.slice(PUBLIC_PREFIX.length + 1)}`;
}

/** Returns where a URL we issued lives, or null for foreign URLs. */
export function locateUrl(url: string): { driver: "local" | "s3"; key: string } | null {
  if (url.startsWith(LOCAL_URL_PREFIX)) {
    const rest = url.slice(LOCAL_URL_PREFIX.length);
    if (!rest || rest.includes("..")) return null;
    return { driver: "local", key: `${PUBLIC_PREFIX}/${rest}` };
  }
  const bases = [
    env.aws.publicBaseUrl,
    env.aws.bucket && env.aws.region ? `https://${env.aws.bucket}.s3.${env.aws.region}.amazonaws.com` : undefined,
  ].filter(Boolean) as string[];
  for (const base of bases) {
    const prefix = `${base.replace(/\/$/, "")}/`;
    if (url.startsWith(prefix)) {
      const key = url.slice(prefix.length);
      return key.startsWith(`${PUBLIC_PREFIX}/`) && !key.includes("..") ? { driver: "s3", key } : null;
    }
  }
  return null;
}

/** Backwards-compatible helper: storage key for a URL we issued. */
export function keyFromPublicUrl(url: string): string | null {
  return locateUrl(url)?.key ?? null;
}

async function writeObject(key: string, buffer: Buffer, contentType: string, isPrivate: boolean) {
  if (storageDriver() === "s3") {
    await s3().send(
      new PutObjectCommand({
        Bucket: env.aws.bucket!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ...(isPrivate
          ? { ServerSideEncryption: "AES256" as const }
          : { CacheControl: "public, max-age=31536000, immutable" }),
      })
    );
    return;
  }
  const target = isPrivate ? localPath(key) : localPath("public", key);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, buffer, { mode: 0o640 });
}

export async function uploadListingImage(file: File, ownerId: string): Promise<string> {
  const { buffer, type } = await readUpload(file, LISTING_LIMITS.imageTypes, LISTING_LIMITS.maxImageBytes);
  const key = `${PUBLIC_PREFIX}/${ownerId}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${type.ext}`;
  await writeObject(key, buffer, type.mime, false);
  return publicUrlForKey(key);
}

export async function deleteListingImage(url: string): Promise<void> {
  const location = locateUrl(url);
  if (!location) return;
  try {
    if (location.driver === "s3") {
      if (!features.s3) return;
      await s3().send(new DeleteObjectCommand({ Bucket: env.aws.bucket!, Key: location.key }));
    } else {
      await fs.rm(localPath("public", location.key), { force: true });
    }
  } catch (error) {
    console.error("[storage] failed to delete", location.key, error);
  }
}

/** Reads a public listing image written by the local driver (served by /uploads/*). */
export async function readLocalPublicImage(relativePath: string) {
  const key = `${PUBLIC_PREFIX}/${relativePath}`;
  if (relativePath.includes("..")) throw notFound();
  try {
    const buffer = await fs.readFile(localPath("public", key));
    const type = sniffFileType(buffer);
    if (!type || type.mime === "application/pdf") throw notFound();
    return { buffer, contentType: type.mime };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw notFound();
  }
}

/** Uploads an identity document to private storage and returns its key. */
export async function uploadPrivateDocument(file: File, userId: string): Promise<string> {
  const { buffer, type } = await readUpload(
    file,
    ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    8 * 1024 * 1024
  );
  const key = `${PRIVATE_PREFIX}/${userId}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${type.ext}`;
  await writeObject(key, buffer, type.mime, true);
  return key;
}

async function readLocalPrivate(key: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(localPath(key));
  } catch {
    return null;
  }
}

/** Short-lived access to a private document (admins only). Checks local disk first, then S3. */
export async function getPrivateDocument(
  key: string
): Promise<{ redirect: string } | { buffer: Buffer; contentType: string }> {
  if (!key.startsWith(`${PRIVATE_PREFIX}/`) || key.includes("..")) throw badRequest("Invalid key");
  const local = await readLocalPrivate(key);
  if (local) return { buffer: local, contentType: sniffFileType(local)?.mime ?? "application/octet-stream" };
  if (!features.s3) throw notFound("Document not found");
  const url = await getSignedUrl(s3(), new GetObjectCommand({ Bucket: env.aws.bucket!, Key: key }), {
    expiresIn: 300,
  });
  return { redirect: url };
}

export async function deletePrivateDocument(key: string) {
  if (!key.startsWith(`${PRIVATE_PREFIX}/`) || key.includes("..")) return;
  try {
    await fs.rm(localPath(key), { force: true });
    if (features.s3) await s3().send(new DeleteObjectCommand({ Bucket: env.aws.bucket!, Key: key }));
  } catch (error) {
    console.error("[storage] failed to delete private doc", error);
  }
}
