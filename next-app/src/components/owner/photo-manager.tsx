"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Star, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api-client";
import { LISTING_LIMITS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { MAX_IMAGE_MB, prepareListingImages } from "./image-utils";

let localId = 0;
const nextLocalId = () => `local-${Date.now()}-${(localId += 1)}`;

type GridItem = { key: string; src: string; local?: boolean };

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

/** Drop zone + hidden file input. */
function DropZone({
  onFiles,
  disabled,
  remaining,
  busy,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  remaining: number;
  busy?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        if (disabled || !e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (disabled || e.dataTransfer.files.length === 0) return;
        e.preventDefault();
        setOver(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
        over ? "border-primary bg-primary/5" : "border-input",
        disabled && "opacity-60"
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-primary">
        {busy ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
      </span>
      <p className="font-medium">{busy ? "Uploading photos…" : "Drag photos here or choose from your phone"}</p>
      <p className="text-xs text-muted-foreground">
        JPG, PNG or WebP · up to {MAX_IMAGE_MB} MB each · {remaining > 0 ? `${remaining} more allowed` : "limit reached"}
      </p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={LISTING_LIMITS.imageTypes.join(",")}
        multiple
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length) onFiles(files);
        }}
      />
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
        <ImagePlus /> Choose photos
      </Button>
    </div>
  );
}

function PhotoGrid({
  items,
  onRemove,
  onReorder,
  disabled,
}: {
  items: GridItem[];
  onRemove: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  disabled?: boolean;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  if (items.length === 0) return null;
  return (
    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Listing photos">
      {items.map((item, index) => (
        <li
          key={item.key}
          draggable={!disabled}
          onDragStart={(e) => {
            setDragIndex(index);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragOver={(e) => {
            if (dragIndex !== null) e.preventDefault();
          }}
          onDrop={(e) => {
            if (dragIndex === null) return;
            e.preventDefault();
            onReorder(dragIndex, index);
            setDragIndex(null);
          }}
          onDragEnd={() => setDragIndex(null)}
          className={cn(
            "group relative overflow-hidden rounded-xl border bg-muted",
            index === 0 && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            dragIndex === index && "opacity-50"
          )}
        >
          <div className="relative aspect-[4/3]">
            <Image
              src={item.src}
              alt={`Photo ${index + 1}${index === 0 ? " (cover)" : ""}`}
              fill
              unoptimized={item.local}
              sizes="(max-width: 640px) 50vw, 240px"
              className="object-cover"
            />
          </div>
          {index === 0 ? (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
              <Star className="size-3" /> Cover
            </span>
          ) : null}
          <div className="flex items-center justify-between gap-1 border-t bg-background/95 p-1.5">
            <div className="flex gap-1">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={disabled || index === 0}
                onClick={() => onReorder(index, index - 1)}
                aria-label={`Move photo ${index + 1} earlier`}
              >
                <ArrowLeft />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={disabled || index === items.length - 1}
                onClick={() => onReorder(index, index + 1)}
                aria-label={`Move photo ${index + 1} later`}
              >
                <ArrowRight />
              </Button>
            </div>
            <div className="flex gap-1">
              {index !== 0 ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => onReorder(index, 0)}
                  aria-label={`Set photo ${index + 1} as cover`}
                  title="Set as cover"
                >
                  <Star />
                </Button>
              ) : null}
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={disabled}
                onClick={() => onRemove(index)}
                aria-label={`Remove photo ${index + 1}`}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function PhotoTips({ count }: { count: number }) {
  const min = LISTING_LIMITS.minImages;
  return (
    <p className={cn("text-sm", count < min ? "text-destructive" : "text-muted-foreground")} aria-live="polite">
      {count < min
        ? `Add at least ${min} photos (${count}/${min}). `
        : `${count} of ${LISTING_LIMITS.maxImages} photos. `}
      The first photo is your cover. Tip: rooms, washroom, kitchen/dining and the building front work best.
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/*                       Create mode: files kept in memory                     */
/* -------------------------------------------------------------------------- */

export type LocalPhoto = { id: string; file: File; url: string };

export function LocalPhotoPicker({
  photos,
  onChange,
}: {
  photos: LocalPhoto[];
  onChange: (photos: LocalPhoto[]) => void;
}) {
  const [preparing, setPreparing] = useState(false);
  const latest = useRef(photos);
  latest.current = photos;

  // Revoke preview URLs when the picker unmounts.
  useEffect(() => () => latest.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const remaining = LISTING_LIMITS.maxImages - photos.length;

  const add = async (files: File[]) => {
    if (remaining <= 0) {
      toast.error(`You can add up to ${LISTING_LIMITS.maxImages} photos`);
      return;
    }
    const accepted = files.slice(0, remaining);
    if (files.length > remaining) toast.warning(`Only the first ${remaining} photo${remaining === 1 ? "" : "s"} were added`);
    setPreparing(true);
    const { files: ready, errors } = await prepareListingImages(accepted);
    setPreparing(false);
    errors.forEach((msg) => toast.error(msg));
    const added = ready.map((file) => ({ id: nextLocalId(), file, url: URL.createObjectURL(file) }));
    onChange([...latest.current, ...added]);
  };

  return (
    <div className="space-y-4">
      <DropZone onFiles={add} disabled={remaining <= 0 || preparing} remaining={remaining} busy={preparing} />
      <PhotoTips count={photos.length} />
      <PhotoGrid
        items={photos.map((p) => ({ key: p.id, src: p.url, local: true }))}
        onRemove={(i) => {
          const target = photos[i];
          if (target) URL.revokeObjectURL(target.url);
          onChange(photos.filter((_, idx) => idx !== i));
        }}
        onReorder={(from, to) => onChange(move(photos, from, to))}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                  Edit mode: changes are saved immediately                   */
/* -------------------------------------------------------------------------- */

export function RemotePhotoManager({
  pgId,
  images,
  onChange,
}: {
  pgId: string;
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const remaining = LISTING_LIMITS.maxImages - images.length;

  const upload = async (files: File[]) => {
    if (remaining <= 0) {
      toast.error(`You can add up to ${LISTING_LIMITS.maxImages} photos`);
      return;
    }
    const accepted = files.slice(0, remaining);
    if (files.length > remaining) toast.warning(`Only the first ${remaining} photo${remaining === 1 ? "" : "s"} will be added`);
    setBusy(true);
    try {
      const { files: ready, errors } = await prepareListingImages(accepted);
      errors.forEach((msg) => toast.error(msg));
      if (ready.length === 0) return;
      const form = new FormData();
      form.append("pgId", pgId);
      ready.forEach((f) => form.append("images", f));
      const res = await api<{ images: string[] }>("/api/dashboard/update/image", { method: "POST", body: form });
      onChange(res.images);
      toast.success(`${ready.length} photo${ready.length === 1 ? "" : "s"} added`);
    } catch (error) {
      toast.error(errorMessage(error, "Could not upload photos"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (index: number) => {
    const imageUrl = images[index];
    if (!imageUrl) return;
    if (images.length <= LISTING_LIMITS.minImages) {
      toast.error(`Keep at least ${LISTING_LIMITS.minImages} photos. Add a new one before removing this.`);
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ images: string[] }>("/api/dashboard/update/image", {
        method: "DELETE",
        body: { pgId, imageUrl },
      });
      onChange(res.images);
      toast.success("Photo removed");
    } catch (error) {
      toast.error(errorMessage(error, "Could not remove the photo"));
    } finally {
      setBusy(false);
    }
  };

  const reorder = async (from: number, to: number) => {
    const next = move(images, from, to);
    if (next === images) return;
    const previous = images;
    onChange(next);
    setBusy(true);
    try {
      const res = await api<{ images: string[] }>("/api/dashboard/update/image", {
        method: "PUT",
        body: { pgId, images: next },
      });
      onChange(res.images);
      if (to === 0) toast.success("Cover photo updated");
    } catch (error) {
      onChange(previous);
      toast.error(errorMessage(error, "Could not reorder photos"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <DropZone onFiles={upload} disabled={busy || remaining <= 0} remaining={remaining} busy={busy} />
      <PhotoTips count={images.length} />
      <PhotoGrid
        items={images.map((src) => ({ key: src, src }))}
        onRemove={remove}
        onReorder={reorder}
        disabled={busy}
      />
      <p className="text-xs text-muted-foreground">Photo changes are saved instantly.</p>
    </div>
  );
}
