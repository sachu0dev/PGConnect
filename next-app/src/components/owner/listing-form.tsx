"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Controller, useForm, type FieldErrors, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crosshair,
  Crown,
  IndianRupee,
  Loader2,
  MapPin,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckboxChip } from "@/components/ui/checkbox-chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiClientError, errorMessage } from "@/lib/api-client";
import {
  AMENITIES,
  GENDER_OPTIONS,
  LISTING_LIMITS,
  POPULAR_CITIES,
  SHARING_TYPES,
  amenityLabel,
  genderLabel,
  sharingLabel,
} from "@/lib/constants";
import { formatINR, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listingSchema, normalizePhone, type ListingInput } from "@/lib/validation";
import type { EditableListing } from "@/server/owner";
import { LocalPhotoPicker, RemotePhotoManager, type LocalPhoto } from "./photo-manager";
import { PlacesSearch, type PlaceResult } from "./places-search";

/* -------------------------------------------------------------------------- */
/*                                Form model                                  */
/* -------------------------------------------------------------------------- */

type FormValues = {
  name: string;
  gender: "MALE" | "FEMALE" | "ANY" | "";
  description: string;
  city: string;
  locality: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  sharingTypes: number[];
  rentPerMonth: string;
  deposit: string;
  capacity: string;
  capacityCount: string;
  noticePeriodDays: string;
  foodIncluded: boolean;
  amenities: string[];
  houseRules: string;
  contact: string;
};

type FieldName = FieldPath<FormValues>;

const STEPS: { id: string; title: string; short: string; fields: FieldName[] }[] = [
  { id: "basics", title: "Basic details", short: "Basics", fields: ["name", "gender", "description"] },
  { id: "location", title: "Location", short: "Location", fields: ["city", "locality", "address", "latitude", "longitude"] },
  {
    id: "rooms",
    title: "Rooms & pricing",
    short: "Pricing",
    fields: ["sharingTypes", "rentPerMonth", "deposit", "capacity", "capacityCount", "noticePeriodDays", "foodIncluded"],
  },
  { id: "amenities", title: "Amenities & house rules", short: "Amenities", fields: ["amenities", "houseRules"] },
  { id: "photos", title: "Photos", short: "Photos", fields: [] },
  { id: "review", title: "Contact & review", short: "Review", fields: ["contact"] },
];
const PHOTOS_STEP = STEPS.findIndex((s) => s.id === "photos");

const FRIENDLY: Partial<Record<FieldName, string>> = {
  gender: "Choose who can stay at this PG",
  rentPerMonth: "Enter the starting monthly rent",
  capacity: "Enter the total number of beds",
  deposit: "Enter a valid deposit amount (0 if none)",
  capacityCount: "Enter how many beds are occupied (0 if none)",
  noticePeriodDays: "Enter the notice period in days (0–180)",
  latitude: "Location coordinates look invalid",
  longitude: "Location coordinates look invalid",
};

function errorText(errors: FieldErrors<FormValues>, name: FieldName): string | undefined {
  const err = errors[name as keyof FormValues];
  if (!err) return undefined;
  const message = typeof err.message === "string" ? err.message : "";
  if (!message || message === "Required" || /^(Expected|Invalid)/.test(message)) {
    return FRIENDLY[name] ?? "Please check this field";
  }
  return message;
}

function emptyValues(contact?: string | null): FormValues {
  return {
    name: "",
    gender: "",
    description: "",
    city: "",
    locality: "",
    address: "",
    latitude: null,
    longitude: null,
    sharingTypes: [],
    rentPerMonth: "",
    deposit: "",
    capacity: "",
    capacityCount: "0",
    noticePeriodDays: "",
    foodIncluded: false,
    amenities: [],
    houseRules: "",
    contact: contact ? normalizePhone(contact) : "",
  };
}

function toFormValues(l: EditableListing): FormValues {
  return {
    name: l.name,
    gender: l.gender,
    description: l.description,
    city: titleCase(l.city),
    locality: l.locality ?? "",
    address: l.address,
    latitude: l.latitude,
    longitude: l.longitude,
    sharingTypes: l.sharingTypes,
    rentPerMonth: String(l.rentPerMonth),
    deposit: String(l.deposit),
    capacity: String(l.capacity),
    capacityCount: String(l.capacityCount),
    noticePeriodDays: l.noticePeriodDays === null ? "" : String(l.noticePeriodDays),
    foodIncluded: l.foodIncluded,
    amenities: l.amenities,
    houseRules: l.houseRules ?? "",
    contact: l.contact,
  };
}

/* -------------------------------------------------------------------------- */
/*                               Small pieces                                 */
/* -------------------------------------------------------------------------- */

function Field({
  id,
  label,
  hint,
  error,
  optional,
  children,
  className,
}: {
  id: string;
  label: string;
  hint?: React.ReactNode;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className={cn(error && "text-destructive")}>
        {label}
        {optional ? <span className="ml-1 font-normal text-muted-foreground">(optional)</span> : null}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function RupeeInput(props: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <IndianRupee className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input inputMode="numeric" className="pl-9" {...props} />
    </div>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 The form                                   */
/* -------------------------------------------------------------------------- */

type CreateProps = { mode: "create"; defaultContact?: string | null };
type EditProps = {
  mode: "edit";
  listing: EditableListing;
  onSaved: (listing: EditableListing) => void;
  onImagesChange: (images: string[]) => void;
};

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const NUMBER_PATTERN = /[^\d]/g;

export function ListingForm(props: CreateProps | EditProps) {
  const isEdit = props.mode === "edit";
  const router = useRouter();
  const uid = useId();
  const topRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(isEdit ? STEPS.length - 1 : 0);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const initialValues = useMemo(
    () => (props.mode === "edit" ? toFormValues(props.listing) : emptyValues(props.defaultContact)),
    // Only computed once per mount; edits re-sync through reset() after saving.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(listingSchema, undefined, { raw: true }),
    defaultValues: initialValues,
    mode: "onTouched",
  });

  const values = watch();
  const descriptionLength = values.description.trim().length;
  const bedsFree = Math.max(0, (Number(values.capacity) || 0) - (Number(values.capacityCount) || 0));
  const hasUnsaved = isDirty || (!isEdit && photos.length > 0);

  useEffect(() => {
    if (!hasUnsaved || submitting) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsaved, submitting]);

  const goTo = (index: number) => {
    setStep(index);
    setFurthest((f) => Math.max(f, index));
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const firstStepWithError = (errs: FieldErrors<FormValues>) =>
    STEPS.findIndex((s) => s.fields.some((f) => errs[f as keyof FormValues]));

  const next = async () => {
    const current = STEPS[step]!;
    const valid = current.fields.length ? await trigger(current.fields, { shouldFocus: true }) : true;
    if (!valid) return;
    if (!isEdit && step === PHOTOS_STEP && photos.length < LISTING_LIMITS.minImages) {
      toast.error(`Add at least ${LISTING_LIMITS.minImages} photos to continue`);
      return;
    }
    goTo(Math.min(step + 1, STEPS.length - 1));
  };

  const applyServerErrors = (error: unknown) => {
    if (!(error instanceof ApiClientError) || !error.details || typeof error.details !== "object") return false;
    let applied = false;
    for (const [key, messages] of Object.entries(error.details as Record<string, unknown>)) {
      if (key in initialValues && Array.isArray(messages) && typeof messages[0] === "string") {
        setError(key as FieldName, { type: "server", message: messages[0] });
        applied = true;
      }
    }
    if (applied) {
      const idx = STEPS.findIndex((s) => s.fields.some((f) => f in (error.details as object)));
      if (idx >= 0) goTo(idx);
    }
    return applied;
  };

  const onValid = async (raw: FormValues) => {
    const parsed = listingSchema.safeParse(raw);
    if (!parsed.success) return;
    const data: ListingInput = parsed.data;
    setLimitError(null);

    if (props.mode === "create") {
      if (photos.length < LISTING_LIMITS.minImages) {
        toast.error(`Add at least ${LISTING_LIMITS.minImages} photos`);
        goTo(PHOTOS_STEP);
        return;
      }
      const form = new FormData();
      for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined) continue;
        form.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
      }
      photos.forEach((p) => form.append("images", p.file));

      setSubmitting(true);
      try {
        const { id } = await api<{ id: string }>("/api/pg/post", { method: "POST", body: form });
        toast.success("Your PG is live! Tenants can now find it in search.");
        router.push(`/dashboard/pgs/${id}`);
      } catch (error) {
        setSubmitting(false);
        if (error instanceof ApiClientError && error.status === 403) {
          setLimitError(error.message);
          return;
        }
        if (!applyServerErrors(error)) toast.error(errorMessage(error, "Could not publish your listing"));
      }
      return;
    }

    setSubmitting(true);
    try {
      const updated = await api<EditableListing>(`/api/dashboard/pg/${props.listing.id}`, {
        method: "PATCH",
        body: data,
      });
      props.onSaved(updated);
      reset(toFormValues(updated));
      toast.success("Changes saved");
    } catch (error) {
      if (!applyServerErrors(error)) toast.error(errorMessage(error, "Could not save your changes"));
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = (errs: FieldErrors<FormValues>) => {
    const idx = firstStepWithError(errs);
    if (idx >= 0) {
      goTo(idx);
      toast.error(`Please fix the highlighted fields in “${STEPS[idx]!.short}”`);
    }
  };

  const submit = handleSubmit(onValid, onInvalid);

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Your browser doesn't support location access");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue("latitude", Number(pos.coords.latitude.toFixed(6)), { shouldDirty: true, shouldValidate: true });
        setValue("longitude", Number(pos.coords.longitude.toFixed(6)), { shouldDirty: true, shouldValidate: true });
        setLocating(false);
        toast.success("Location pinned");
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. You can allow it from your browser settings."
            : "Couldn't get your location. Please try again."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const applyPlace = (place: PlaceResult) => {
    const opts = { shouldDirty: true, shouldValidate: true } as const;
    if (place.address) setValue("address", place.address, opts);
    if (place.city) setValue("city", place.city, opts);
    if (place.locality) setValue("locality", place.locality, opts);
    setValue("latitude", place.latitude, opts);
    setValue("longitude", place.longitude, opts);
  };

  const id = (name: string) => `${uid}-${name}`;
  const aria = (name: FieldName) => ({
    id: id(name),
    "aria-invalid": Boolean(errors[name as keyof FormValues]) || undefined,
    "aria-describedby": errors[name as keyof FormValues] ? `${id(name)}-error` : `${id(name)}-hint`,
  });

  const progress = Math.round(((step + 1) / STEPS.length) * 100);
  const currentStep = STEPS[step]!;
  const isLast = step === STEPS.length - 1;
  const photoCount = props.mode === "edit" ? props.listing.images.length : photos.length;

  return (
    <form
      onSubmit={(e) => {
        // In the create wizard, Enter moves to the next step instead of publishing.
        if (!isEdit && !isLast) {
          e.preventDefault();
          void next();
          return;
        }
        void submit(e);
      }}
      noValidate className="space-y-5" aria-label={isEdit ? "Edit listing" : "Add listing"}>
      <div ref={topRef} className="scroll-mt-32" />

      {limitError ? (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-amber-950 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100 sm:flex-row sm:items-center">
          <Crown className="size-5 shrink-0" />
          <p className="flex-1 text-sm">{limitError}</p>
          <Button size="sm" asChild>
            <Link href="/membership">Upgrade plan</Link>
          </Button>
        </div>
      ) : null}

      {/* Progress */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <p className="font-medium">
            Step {step + 1} of {STEPS.length} · <span className="text-primary">{currentStep.title}</span>
          </p>
          <p className="text-muted-foreground">{progress}%</p>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Form progress"
        >
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <ol className="scrollbar-none mt-3 flex gap-1 overflow-x-auto">
          {STEPS.map((s, i) => {
            const reachable = i <= furthest;
            const hasError = s.fields.some((f) => errors[f as keyof FormValues]);
            return (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => goTo(i)}
                  aria-current={i === step ? "step" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    i === step
                      ? "bg-primary text-primary-foreground"
                      : hasError
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {i < step && !hasError ? <Check className="size-3" /> : <span>{i + 1}</span>}
                  {s.short}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Step 1: Basics */}
      <div hidden={currentStep.id !== "basics"}>
        <SectionCard title="Tell tenants about your PG" description="A clear name and honest description build trust.">
          <Field id={id("name")} label="PG name" error={errorText(errors, "name")} hint="E.g. “Sai Comforts PG for Men” or “Green Nest Co-living”">
            <Input {...register("name")} {...aria("name")} maxLength={80} autoComplete="off" />
          </Field>

          <div className="space-y-2">
            <p id={id("gender-label")} className={cn("text-sm font-medium", errors.gender && "text-destructive")}>
              Who can stay?
            </p>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <div role="radiogroup" aria-labelledby={id("gender-label")} className="grid grid-cols-3 gap-2">
                  {GENDER_OPTIONS.map((g) => {
                    const checked = field.value === g.value;
                    return (
                      <button
                        key={g.value}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        onClick={() => field.onChange(g.value)}
                        onBlur={field.onBlur}
                        className={cn(
                          "rounded-lg border px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          checked ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"
                        )}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.gender ? (
              <p className="text-xs font-medium text-destructive" role="alert">
                {errorText(errors, "gender")}
              </p>
            ) : null}
          </div>

          <Field
            id={id("description")}
            label="Description"
            error={errorText(errors, "description")}
            hint={
              <span className="flex justify-between gap-2">
                <span>Mention room types, food timings, nearby colleges/offices and transport.</span>
                <span className={cn("tabular-nums", descriptionLength < 30 && "text-amber-600")}>
                  {descriptionLength}/3000
                </span>
              </span>
            }
          >
            <Textarea {...register("description")} {...aria("description")} rows={6} maxLength={3000} />
          </Field>
          {errors.description ? (
            <p className="-mt-3 text-right text-xs tabular-nums text-muted-foreground">{descriptionLength}/3000</p>
          ) : null}
        </SectionCard>
      </div>

      {/* Step 2: Location */}
      <div hidden={currentStep.id !== "location"}>
        <SectionCard title="Where is your PG?" description="Tenants search by area, so add the locality they know it by.">
          {MAPS_KEY && currentStep.id === "location" ? <PlacesSearch apiKey={MAPS_KEY} onPlace={applyPlace} /> : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id={id("city")} label="City" error={errorText(errors, "city")}>
              <Input {...register("city")} {...aria("city")} list={id("cities")} autoComplete="address-level2" />
              <datalist id={id("cities")}>
                {POPULAR_CITIES.map((c) => (
                  <option key={c} value={titleCase(c)} />
                ))}
              </datalist>
            </Field>
            <Field
              id={id("locality")}
              label="Locality / area"
              error={errorText(errors, "locality")}
              hint="E.g. Koramangala, Viman Nagar, Laxmi Nagar"
            >
              <Input {...register("locality")} {...aria("locality")} autoComplete="address-level3" />
            </Field>
          </div>

          <Field
            id={id("address")}
            label="Full address"
            error={errorText(errors, "address")}
            hint="Building name, street, landmark and PIN code"
          >
            <Textarea {...register("address")} {...aria("address")} rows={3} maxLength={300} autoComplete="street-address" />
          </Field>

          <div className="rounded-lg border border-dashed p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">Map location</p>
                  <p className="text-xs text-muted-foreground">
                    {values.latitude !== null && values.longitude !== null
                      ? `Pinned at ${values.latitude.toFixed(5)}, ${values.longitude.toFixed(5)}`
                      : "Optional — helps tenants searching “PG near me”. Use it while you're at the PG."}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {values.latitude !== null ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setValue("latitude", null, { shouldDirty: true });
                      setValue("longitude", null, { shouldDirty: true });
                    }}
                  >
                    <X /> Clear
                  </Button>
                ) : null}
                <Button type="button" variant="outline" size="sm" onClick={useMyLocation} loading={locating}>
                  {!locating ? <Crosshair /> : null} Use current location
                </Button>
              </div>
            </div>
            {errors.latitude || errors.longitude ? (
              <p className="mt-2 text-xs font-medium text-destructive">{errorText(errors, "latitude")}</p>
            ) : null}
          </div>
        </SectionCard>
      </div>

      {/* Step 3: Rooms & pricing */}
      <div hidden={currentStep.id !== "rooms"}>
        <SectionCard title="Rooms & pricing" description="Transparent pricing gets more serious enquiries.">
          <div className="space-y-2">
            <p id={id("sharing-label")} className={cn("text-sm font-medium", errors.sharingTypes && "text-destructive")}>
              Sharing options available
            </p>
            <Controller
              control={control}
              name="sharingTypes"
              render={({ field }) => (
                <div role="group" aria-labelledby={id("sharing-label")} className="flex flex-wrap gap-2">
                  {SHARING_TYPES.map((s) => (
                    <CheckboxChip
                      key={s.value}
                      checked={field.value.includes(s.value)}
                      onCheckedChange={(checked) => {
                        field.onChange(
                          checked ? [...field.value, s.value].sort() : field.value.filter((v) => v !== s.value)
                        );
                        field.onBlur();
                      }}
                    >
                      {s.label}
                    </CheckboxChip>
                  ))}
                </div>
              )}
            />
            {errors.sharingTypes ? (
              <p className="text-xs font-medium text-destructive" role="alert">
                {errorText(errors, "sharingTypes")}
              </p>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id={id("rentPerMonth")}
              label="Starting rent per month"
              error={errorText(errors, "rentPerMonth")}
              hint="Lowest rent per bed, e.g. for triple sharing"
            >
              <RupeeInput
                {...register("rentPerMonth", { setValueAs: (v: string) => v.replace(NUMBER_PATTERN, "") })}
                {...aria("rentPerMonth")}
                placeholder="8000"
              />
            </Field>
            <Field id={id("deposit")} label="Security deposit" error={errorText(errors, "deposit")} hint="Enter 0 if there's no deposit">
              <RupeeInput
                {...register("deposit", { setValueAs: (v: string) => v.replace(NUMBER_PATTERN, "") })}
                {...aria("deposit")}
                placeholder="10000"
              />
            </Field>
            <Field id={id("capacity")} label="Total beds" error={errorText(errors, "capacity")}>
              <Input
                {...register("capacity", { setValueAs: (v: string) => v.replace(NUMBER_PATTERN, "") })}
                {...aria("capacity")}
                inputMode="numeric"
                placeholder="24"
              />
            </Field>
            <Field
              id={id("capacityCount")}
              label="Beds occupied right now"
              error={errorText(errors, "capacityCount")}
              hint={values.capacity ? `${bedsFree} bed${bedsFree === 1 ? "" : "s"} will show as available` : undefined}
            >
              <Input
                {...register("capacityCount", { setValueAs: (v: string) => v.replace(NUMBER_PATTERN, "") })}
                {...aria("capacityCount")}
                inputMode="numeric"
                placeholder="0"
              />
            </Field>
            <Field
              id={id("noticePeriodDays")}
              label="Notice period (days)"
              optional
              error={errorText(errors, "noticePeriodDays")}
              hint="How early tenants must inform before leaving"
            >
              <Input
                {...register("noticePeriodDays", { setValueAs: (v: string) => v.replace(NUMBER_PATTERN, "") })}
                {...aria("noticePeriodDays")}
                inputMode="numeric"
                placeholder="30"
              />
            </Field>
            <div className="space-y-2">
              <p id={id("food-label")} className="text-sm font-medium">
                Food
              </p>
              <Controller
                control={control}
                name="foodIncluded"
                render={({ field }) => (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value}
                    aria-labelledby={id("food-label")}
                    onClick={() => field.onChange(!field.value)}
                    className="flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span>{field.value ? "Meals included in rent" : "Meals not included"}</span>
                    <span
                      className={cn(
                        "relative h-6 w-11 rounded-full transition-colors",
                        field.value ? "bg-primary" : "bg-muted-foreground/30"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
                          field.value ? "left-[22px]" : "left-0.5"
                        )}
                      />
                    </span>
                  </button>
                )}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Step 4: Amenities */}
      <div hidden={currentStep.id !== "amenities"}>
        <SectionCard title="Amenities & house rules" description="Select everything tenants get at no extra cost.">
          <Controller
            control={control}
            name="amenities"
            render={({ field }) => (
              <div role="group" aria-label="Amenities" className="flex flex-wrap gap-2">
                {AMENITIES.map((a) => (
                  <CheckboxChip
                    key={a.id}
                    checked={field.value.includes(a.id)}
                    onCheckedChange={(checked) =>
                      field.onChange(checked ? [...field.value, a.id] : field.value.filter((v) => v !== a.id))
                    }
                  >
                    {a.label}
                  </CheckboxChip>
                ))}
              </div>
            )}
          />
          <Field
            id={id("houseRules")}
            label="House rules"
            optional
            error={errorText(errors, "houseRules")}
            hint={`E.g. gate closing time, guests policy, smoking/alcohol rules. ${values.houseRules.length}/1000`}
          >
            <Textarea {...register("houseRules")} {...aria("houseRules")} rows={4} maxLength={1000} />
          </Field>
        </SectionCard>
      </div>

      {/* Step 5: Photos */}
      <div hidden={currentStep.id !== "photos"}>
        <SectionCard
          title="Photos"
          description="Real, well-lit photos are the #1 reason tenants enquire. Avoid stock images and watermarks."
        >
          {props.mode === "edit" ? (
            <RemotePhotoManager pgId={props.listing.id} images={props.listing.images} onChange={props.onImagesChange} />
          ) : (
            <LocalPhotoPicker photos={photos} onChange={setPhotos} />
          )}
        </SectionCard>
      </div>

      {/* Step 6: Contact & review */}
      <div hidden={currentStep.id !== "review"}>
        <SectionCard title="Contact & review" description="Check everything once before you publish.">
          <Field
            id={id("contact")}
            label="Contact number for tenants"
            error={errorText(errors, "contact")}
            hint="Shown only to signed-in tenants who tap “Show number”. Never shared publicly."
          >
            <div className="flex">
              <span className="inline-flex items-center rounded-l-lg border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                +91
              </span>
              <Input
                {...register("contact")}
                {...aria("contact")}
                inputMode="tel"
                autoComplete="tel-national"
                className="rounded-l-none"
                placeholder="98765 43210"
              />
            </div>
          </Field>

          <dl className="divide-y rounded-lg border text-sm">
            {[
              { label: "PG name", value: values.name || "—", step: 0 },
              { label: "For", value: values.gender ? genderLabel(values.gender) : "—", step: 0 },
              {
                label: "Location",
                value: [values.locality, values.city ? titleCase(values.city) : ""].filter(Boolean).join(", ") || "—",
                step: 1,
              },
              {
                label: "Rent / deposit",
                value: `${values.rentPerMonth ? formatINR(Number(values.rentPerMonth)) : "—"} / ${
                  values.deposit ? formatINR(Number(values.deposit)) : "—"
                }`,
                step: 2,
              },
              {
                label: "Sharing",
                value: values.sharingTypes.length ? values.sharingTypes.map(sharingLabel).join(", ") : "—",
                step: 2,
              },
              { label: "Beds", value: values.capacity ? `${bedsFree} free of ${values.capacity}` : "—", step: 2 },
              { label: "Food", value: values.foodIncluded ? "Included" : "Not included", step: 2 },
              {
                label: "Amenities",
                value: values.amenities.length ? values.amenities.map(amenityLabel).join(", ") : "None selected",
                step: 3,
              },
              { label: "Photos", value: `${photoCount} added`, step: PHOTOS_STEP },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-3 px-3 py-2.5">
                <dt className="w-28 shrink-0 text-muted-foreground">{row.label}</dt>
                <dd className="min-w-0 flex-1 break-words">{row.value}</dd>
                <button
                  type="button"
                  onClick={() => goTo(row.step)}
                  className="shrink-0 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Edit<span className="sr-only"> {row.label}</span>
                </button>
              </div>
            ))}
          </dl>
          {!isEdit ? (
            <p className="text-xs text-muted-foreground">
              By publishing you confirm the details and photos are accurate and belong to this property. Listings that
              ask tenants for advance payment before a visit may be removed.
            </p>
          ) : null}
        </SectionCard>
      </div>

      {/* Footer actions */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:shadow-sm">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={() => goTo(Math.max(0, step - 1))} disabled={step === 0 || submitting}>
            <ArrowLeft /> <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="ml-auto flex items-center gap-2">
            {isEdit ? (
              <Button
                type="submit"
                variant={isLast ? "default" : "outline"}
                loading={submitting}
                disabled={!isDirty}
              >
                {!submitting ? <Save /> : null} Save changes
              </Button>
            ) : null}
            {!isLast ? (
              <Button type="button" onClick={next} variant={isEdit ? "secondary" : "default"} disabled={submitting}>
                Continue <ArrowRight />
              </Button>
            ) : !isEdit ? (
              <Button type="submit" loading={submitting}>
                {submitting ? "Publishing…" : "Publish listing"}
              </Button>
            ) : null}
          </div>
        </div>
        {submitting && !isEdit ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
            <Loader2 className="size-3 animate-spin" /> Uploading {photos.length} photos — keep this page open.
          </p>
        ) : null}
      </div>
    </form>
  );
}
