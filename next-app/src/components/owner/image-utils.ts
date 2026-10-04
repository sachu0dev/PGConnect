"use client";

import { LISTING_LIMITS } from "@/lib/constants";

const COMPRESS_ABOVE_BYTES = 900 * 1024;
const MAX_DIMENSION = 1920;

export const MAX_IMAGE_MB = Math.round(LISTING_LIMITS.maxImageBytes / (1024 * 1024));

export class ImageCheckError extends Error {}

/**
 * Client-side checks + downscaling for listing photos. Phone cameras produce
 * 4–8 MB photos; resizing to ~1920px keeps uploads fast on mobile data while
 * staying sharp on the listing page. The server re-validates everything.
 */
export async function prepareListingImage(file: File): Promise<File> {
  if (!(LISTING_LIMITS.imageTypes as readonly string[]).includes(file.type)) {
    throw new ImageCheckError(`"${file.name}" isn't supported. Use JPG, PNG or WebP photos.`);
  }

  let output = file;
  if (file.size > COMPRESS_ABOVE_BYTES && typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
        if (blob && blob.size < file.size) {
          output = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
        }
      }
      bitmap.close();
    } catch {
      output = file;
    }
  }

  if (output.size > LISTING_LIMITS.maxImageBytes) {
    throw new ImageCheckError(`"${file.name}" is larger than ${MAX_IMAGE_MB} MB. Please choose a smaller photo.`);
  }
  return output;
}

/** Prepares several files, collecting per-file problems instead of failing the batch. */
export async function prepareListingImages(files: File[]) {
  const ok: File[] = [];
  const errors: string[] = [];
  for (const file of files) {
    try {
      ok.push(await prepareListingImage(file));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `Couldn't read "${file.name}"`);
    }
  }
  return { files: ok, errors };
}
