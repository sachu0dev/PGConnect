import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, BedDouble, ImageIcon, MapPin, Sparkles, Star, UtensilsCrossed } from "lucide-react";
import type { PgCard as PgCardData } from "@/lib/types";
import { genderLabel, sharingLabel } from "@/lib/constants";
import { formatINR, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "./favorite-button";

export function PgCard({
  pg,
  saved,
  priority,
  className,
}: {
  pg: PgCardData;
  saved?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const location = [pg.locality, titleCase(pg.city)].filter(Boolean).join(", ");

  return (
    <Link
      href={`/pg/${pg.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {pg.image ? (
          <Image
            src={pg.image}
            alt={pg.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageIcon className="size-8" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold backdrop-blur">
            {genderLabel(pg.gender)}
          </span>
          {pg.isFeatured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-semibold text-amber-950">
              <Sparkles className="size-3" /> Featured
            </span>
          ) : null}
        </div>
        <FavoriteButton pgId={pg.id} initial={saved} className="absolute right-3 top-3" />
        {pg.imageCount > 1 ? (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
            {pg.imageCount} photos
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold leading-snug">{pg.name}</h3>
          {pg.reviewCount > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {pg.avgRating.toFixed(1)}
              <span className="text-muted-foreground">({pg.reviewCount})</span>
            </span>
          ) : null}
        </div>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="line-clamp-1">{location}</span>
          {pg.distanceKm !== undefined ? <span className="shrink-0">· {pg.distanceKm} km</span> : null}
        </p>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {pg.isVerifiedOwner ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 font-medium text-success">
              <BadgeCheck className="size-3.5" /> Verified owner
            </span>
          ) : null}
          {pg.foodIncluded ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 font-medium text-secondary-foreground">
              <UtensilsCrossed className="size-3.5" /> Food
            </span>
          ) : null}
          {pg.sharingTypes.slice(0, 3).map((s) => (
            <span key={s} className="rounded-md bg-muted px-2 py-1 font-medium text-muted-foreground">
              {sharingLabel(s)}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Starts from</p>
            <p className="text-lg font-bold">
              {formatINR(pg.rentPerMonth)}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              pg.bedsAvailable > 0 ? "text-success" : "text-destructive"
            )}
          >
            <BedDouble className="size-3.5" />
            {pg.bedsAvailable > 0 ? `${pg.bedsAvailable} beds left` : "Full"}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function PgCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
