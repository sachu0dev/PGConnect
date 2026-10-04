import { searchSchema, type SearchParams } from "@/lib/validation";
import { AMENITIES, GENDER_OPTIONS, SORT_OPTIONS, sharingLabel } from "@/lib/constants";
import { formatINR, titleCase } from "@/lib/format";

/**
 * URL <-> filter state helpers shared by the search page (server) and the
 * filter controls (client). Kept free of server-only imports.
 */

export type FilterState = {
  q?: string;
  city?: string;
  /** Display label for a lat/lng search (e.g. "Christ University"). */
  near?: string;
  gender?: "MALE" | "FEMALE" | "ANY";
  sharing?: number;
  minRent?: number;
  maxRent?: number;
  amenities?: string[];
  food?: boolean;
  available?: boolean;
  verified?: boolean;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: SearchParams["sort"];
  page?: number;
};

type RawParams = Record<string, string | string[] | undefined>;

function flatten(raw: RawParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (typeof v === "string" && v !== "") out[key] = v;
  }
  return out;
}

/**
 * Validates URL params with `searchSchema`. Invalid params are dropped one by
 * one instead of failing the whole request, so a bad link never crashes.
 */
export function parseSearchParams(raw: RawParams): { params: SearchParams; near?: string } {
  const flat = flatten(raw);
  let params: SearchParams | null = null;
  for (let attempt = 0; attempt < 12 && !params; attempt++) {
    const result = searchSchema.safeParse(flat);
    if (result.success) {
      params = result.data;
    } else {
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") delete flat[key];
      }
      if (result.error.issues.every((i) => typeof i.path[0] !== "string")) break;
    }
  }
  params ??= searchSchema.parse({});

  if (params.minRent !== undefined && params.maxRent !== undefined && params.minRent > params.maxRent) {
    params = { ...params, minRent: params.maxRent, maxRent: params.minRent };
  }
  const hasPoint = params.lat !== undefined && params.lng !== undefined;
  if (!hasPoint) {
    params = { ...params, lat: undefined, lng: undefined };
    if (params.sort === "distance") params = { ...params, sort: "recommended" };
  }
  const near = hasPoint && flat.near ? flat.near.trim().slice(0, 80) : undefined;
  return { params, near: near || undefined };
}

export function toFilterState(p: SearchParams, near?: string): FilterState {
  return {
    q: p.q || undefined,
    city: p.city || undefined,
    near,
    gender: p.gender,
    sharing: p.sharing,
    minRent: p.minRent,
    maxRent: p.maxRent,
    amenities: p.amenities.length ? [...p.amenities] : undefined,
    food: p.food,
    available: p.available || undefined,
    verified: p.verified || undefined,
    lat: p.lat,
    lng: p.lng,
    radiusKm: p.radiusKm !== 5 ? p.radiusKm : undefined,
    sort: p.sort !== "recommended" ? p.sort : undefined,
    page: p.page > 1 ? p.page : undefined,
  };
}

export function toQueryString(s: FilterState): string {
  const qs = new URLSearchParams();
  if (s.q) qs.set("q", s.q);
  if (s.city) qs.set("city", s.city);
  if (s.lat !== undefined && s.lng !== undefined) {
    qs.set("lat", String(Math.round(s.lat * 1e5) / 1e5));
    qs.set("lng", String(Math.round(s.lng * 1e5) / 1e5));
    if (s.near) qs.set("near", s.near);
    if (s.radiusKm !== undefined && s.radiusKm !== 5) qs.set("radiusKm", String(s.radiusKm));
  }
  if (s.gender) qs.set("gender", s.gender);
  if (s.sharing) qs.set("sharing", String(s.sharing));
  if (s.minRent !== undefined) qs.set("minRent", String(s.minRent));
  if (s.maxRent !== undefined) qs.set("maxRent", String(s.maxRent));
  if (s.amenities?.length) qs.set("amenities", s.amenities.join(","));
  if (s.food !== undefined) qs.set("food", String(s.food));
  if (s.available) qs.set("available", "true");
  if (s.verified) qs.set("verified", "true");
  if (s.sort && s.sort !== "recommended") qs.set("sort", s.sort);
  if (s.page && s.page > 1) qs.set("page", String(s.page));
  return qs.toString();
}

export function buildHref(basePath: string, s: FilterState): string {
  const qs = toQueryString(s);
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Number of refinement filters applied (location, sort and page excluded). */
export function countFilters(s: FilterState): number {
  return (
    (s.gender ? 1 : 0) +
    (s.sharing ? 1 : 0) +
    (s.minRent !== undefined || s.maxRent !== undefined ? 1 : 0) +
    (s.amenities?.length ?? 0) +
    (s.food !== undefined ? 1 : 0) +
    (s.available ? 1 : 0) +
    (s.verified ? 1 : 0)
  );
}

export function clearFilters(s: FilterState): FilterState {
  return { q: s.q, city: s.city, near: s.near, lat: s.lat, lng: s.lng, radiusKm: s.radiusKm, sort: s.sort };
}

export function budgetLabel(min?: number, max?: number): string | null {
  if (min !== undefined && max !== undefined) return `${formatINR(min)} – ${formatINR(max)}`;
  if (max !== undefined) return `Under ${formatINR(max)}`;
  if (min !== undefined) return `Above ${formatINR(min)}`;
  return null;
}

export type FilterPill = { key: string; label: string; next: FilterState };

/** Active filter pills; each carries the state with that filter removed. */
export function activePills(s: FilterState): FilterPill[] {
  const base: FilterState = { ...s, page: undefined };
  const pills: FilterPill[] = [];
  if (s.gender) {
    const label = GENDER_OPTIONS.find((g) => g.value === s.gender)?.label ?? s.gender;
    pills.push({ key: "gender", label, next: { ...base, gender: undefined } });
  }
  if (s.sharing) pills.push({ key: "sharing", label: sharingLabel(s.sharing), next: { ...base, sharing: undefined } });
  const budget = budgetLabel(s.minRent, s.maxRent);
  if (budget) pills.push({ key: "budget", label: budget, next: { ...base, minRent: undefined, maxRent: undefined } });
  if (s.food !== undefined) {
    pills.push({ key: "food", label: s.food ? "With food" : "Without food", next: { ...base, food: undefined } });
  }
  if (s.available) pills.push({ key: "available", label: "Beds available", next: { ...base, available: undefined } });
  if (s.verified) pills.push({ key: "verified", label: "Verified owners", next: { ...base, verified: undefined } });
  for (const id of s.amenities ?? []) {
    const label = AMENITIES.find((a) => a.id === id)?.label ?? id;
    pills.push({
      key: `amenity-${id}`,
      label,
      next: { ...base, amenities: (s.amenities ?? []).filter((a) => a !== id) },
    });
  }
  return pills;
}

/** Human-readable place for headings: "Koramangala, Bengaluru". */
export function placeLabel(s: FilterState): string | null {
  if (s.near) return s.near;
  if (s.q) return s.q.split(",").slice(0, 2).map((p) => p.trim()).filter(Boolean).join(", ");
  if (s.city) return titleCase(s.city);
  if (s.lat !== undefined) return "you";
  return null;
}

export const SORT_LABELS: Record<string, string> = Object.fromEntries([
  ...SORT_OPTIONS.map((o) => [o.value, o.label]),
  ["distance", "Nearest first"],
]);

export const BUDGET_PRESETS = [
  { label: "Under ₹6k", min: undefined, max: 6000 },
  { label: "₹6k – ₹10k", min: 6000, max: 10000 },
  { label: "₹10k – ₹15k", min: 10000, max: 15000 },
  { label: "₹15k – ₹25k", min: 15000, max: 25000 },
  { label: "Above ₹25k", min: 25000, max: undefined },
] as const;
