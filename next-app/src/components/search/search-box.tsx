"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { LocateFixed, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildHref, type FilterState } from "./search-url";
import { MAPS_API_KEY } from "./maps-config";
import type { PlaceSelection } from "./places-enhancer";

const PlacesEnhancer = MAPS_API_KEY ? dynamic(() => import("./places-enhancer"), { ssr: false }) : null;

/**
 * Location search used on the home hero and the search page. Plain text search
 * always works; Google Places suggestions are layered on when a key is set.
 */
export function SearchBox({
  defaultValue = "",
  keep,
  size = "default",
  className,
  autoFocus,
  presetCity,
  placeholder = "Area, college, office or city",
}: {
  defaultValue?: string;
  /** Refinement filters to keep when searching a new place. */
  keep?: FilterState;
  size?: "default" | "lg";
  className?: string;
  autoFocus?: boolean;
  /** Keeps searches scoped to this city (city landing pages). */
  presetCity?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [locating, setLocating] = useState(false);
  const [pending, startTransition] = useTransition();

  const base: FilterState = {
    ...keep,
    q: undefined,
    city: presetCity,
    near: undefined,
    lat: undefined,
    lng: undefined,
    page: undefined,
    sort: keep?.sort === "distance" ? undefined : keep?.sort,
  };

  const go = (state: FilterState) => startTransition(() => router.push(buildHref("/pgs", state)));

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const q = value.trim().slice(0, 100);
    go({ ...base, q: q || undefined });
  };

  const onPlace = (place: PlaceSelection) => {
    setValue(place.label);
    if (place.kind === "point") {
      go({ ...base, lat: place.lat, lng: place.lng, near: place.label, sort: "distance" });
    } else {
      go({ ...base, q: place.label.slice(0, 100) });
    }
  };

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Location is not supported on this device. Type your area instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        go({ ...base, lat: pos.coords.latitude, lng: pos.coords.longitude, sort: "distance" });
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Allow it in your browser or type your area."
            : "Could not get your location. Please type your area instead."
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  };

  const lg = size === "lg";

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className={cn(
        "flex w-full flex-col gap-2 rounded-2xl border bg-background p-2 shadow-sm sm:flex-row sm:items-center",
        lg && "shadow-lg",
        className
      )}
    >
      <label className="flex min-w-0 flex-1 items-center gap-2 px-2">
        <Search className={cn("shrink-0 text-muted-foreground", lg ? "size-5" : "size-4")} aria-hidden />
        <span className="sr-only">{placeholder}</span>
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          maxLength={100}
          autoFocus={autoFocus}
          className={cn(
            "w-full min-w-0 bg-transparent outline-none placeholder:text-muted-foreground",
            lg ? "h-12 text-base" : "h-10 text-base md:text-sm"
          )}
        />
      </label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size={lg ? "lg" : "default"}
          onClick={useMyLocation}
          disabled={locating}
          className="flex-1 sm:flex-none"
          title="Find PGs near your current location"
        >
          {locating ? <Loader2 className="animate-spin" /> : <LocateFixed />}
          {lg ? "Use my location" : "Near me"}
        </Button>
        <Button type="submit" size={lg ? "lg" : "default"} loading={pending} className="flex-1 sm:flex-none">
          {!pending ? <Search /> : null}
          Search
        </Button>
      </div>
      {PlacesEnhancer ? <PlacesEnhancer inputRef={inputRef} onSelect={onPlace} /> : null}
    </form>
  );
}
