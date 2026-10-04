"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { z } from "zod";
import {
  BadgeCheck,
  Clock3,
  FileCheck2,
  FileUp,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { DashboardHeading } from "@/components/dashboard/dashboard-shell";
import { api, ApiClientError, errorMessage, refreshAccessToken } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { ownerVerificationSchema } from "@/lib/validation";

type DocumentType = z.infer<typeof ownerVerificationSchema>["documentType"];
type FormValues = z.infer<typeof ownerVerificationSchema>;

type Verification = {
  status: "PENDING" | "APPROVED" | "REJECTED";
  documentType: string;
  documentLast4: string;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "AADHAAR", label: "Aadhaar card (masked)" },
  { value: "PAN", label: "PAN card" },
  { value: "DRIVING_LICENCE", label: "Driving licence" },
  { value: "VOTER_ID", label: "Voter ID" },
  { value: "PASSPORT", label: "Passport" },
  { value: "PROPERTY_PAPER", label: "Property document (bill / deed / agreement)" },
];
const documentLabel = (v: string) => DOCUMENT_TYPES.find((d) => d.value === v)?.label ?? v;

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/** /api/auth/* calls skip the client's automatic token refresh, so retry once here. */
async function authed<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401 && (await refreshAccessToken())) return fn();
    throw error;
  }
}

function WhyVerify() {
  const items = [
    { icon: BadgeCheck, title: "Verified owner badge", text: "Shown on all your listings and in search results." },
    { icon: ShieldCheck, title: "More trust", text: "Tenants can filter for verified owners and feel safer enquiring." },
    { icon: TrendingUp, title: "More leads", text: "Trusted listings get more callbacks, chats and visits." },
  ];
  return (
    <ul className="grid gap-3 sm:grid-cols-3">
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="rounded-xl border bg-card p-4 shadow-sm">
          <Icon className="size-5 text-primary" />
          <p className="mt-2 font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{text}</p>
        </li>
      ))}
    </ul>
  );
}

function PrivacyNote() {
  return (
    <div className="flex gap-3 rounded-xl border bg-secondary/50 p-4 text-sm">
      <Lock className="mt-0.5 size-5 shrink-0 text-primary" />
      <div className="space-y-1">
        <p className="font-semibold">Your privacy comes first</p>
        <p className="text-muted-foreground">
          We only store the <strong className="text-foreground">last 4 characters</strong> of your document number —
          never the full number. Your document is stored privately and is seen only by our verification team. It is
          never shown to tenants.
        </p>
        <p className="text-muted-foreground">
          Using Aadhaar? Please upload a <strong className="text-foreground">masked Aadhaar</strong> (available on the
          UIDAI website), which hides the first 8 digits.
        </p>
      </div>
    </div>
  );
}

function StatusCard({ v }: { v: Verification }) {
  if (v.status === "APPROVED") {
    return (
      <div className="flex gap-4 rounded-xl border border-success/30 bg-success/10 p-5">
        <BadgeCheck className="size-8 shrink-0 text-success" />
        <div>
          <p className="text-lg font-semibold">You&apos;re a verified owner</p>
          <p className="text-sm text-muted-foreground">
            The Verified owner badge now appears on all your listings.
            {v.reviewedAt ? ` Approved on ${format(new Date(v.reviewedAt), "d MMM yyyy")}.` : ""}
          </p>
        </div>
      </div>
    );
  }
  if (v.status === "PENDING") {
    return (
      <div className="flex gap-4 rounded-xl border border-warning/40 bg-warning/10 p-5">
        <Clock3 className="size-8 shrink-0 text-warning-foreground dark:text-warning" />
        <div>
          <p className="text-lg font-semibold">Your documents are under review</p>
          <p className="text-sm text-muted-foreground">
            Submitted on {format(new Date(v.createdAt), "d MMM yyyy")} · {documentLabel(v.documentType)} ending in{" "}
            <span className="font-mono">{v.documentLast4}</span>. We&apos;ll email you once our team has reviewed it.
            Your listings stay live meanwhile.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-4 rounded-xl border border-destructive/30 bg-destructive/10 p-5">
      <ShieldAlert className="size-8 shrink-0 text-destructive" />
      <div>
        <p className="text-lg font-semibold">We couldn&apos;t verify your last request</p>
        {v.reviewNote ? (
          <p className="mt-1 text-sm">
            <span className="font-medium">Reviewer note:</span> {v.reviewNote}
          </p>
        ) : null}
        <p className="mt-1 text-sm text-muted-foreground">Please fix the issue and submit again below.</p>
      </div>
    </div>
  );
}

function VerificationForm({ onSubmitted }: { onSubmitted: (v: Verification) => void }) {
  const { user } = useAuth();
  const uid = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(ownerVerificationSchema),
    defaultValues: { fullName: "", documentType: undefined, documentLast4: "" },
  });

  const pickFile = (f: File | null) => {
    setFileError(null);
    if (!f) return setFile(null);
    if (!ACCEPT.includes(f.type)) {
      setFile(null);
      setFileError("Upload a JPG, PNG, WebP image or a PDF");
      return;
    }
    if (f.size > MAX_BYTES) {
      setFile(null);
      setFileError("The file must be under 8 MB");
      return;
    }
    setFile(f);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!file) {
      setFileError("Attach a photo or PDF of your document");
      return;
    }
    const form = new FormData();
    form.append("fullName", values.fullName);
    form.append("documentType", values.documentType);
    form.append("documentLast4", values.documentLast4);
    form.append("document", file);
    setSubmitting(true);
    try {
      const result = await authed(() =>
        api<Verification>("/api/auth/verify-owner", { method: "POST", body: form })
      );
      toast.success("Submitted! We'll email you once it's reviewed.");
      onSubmitted(result);
    } catch (error) {
      toast.error(errorMessage(error, "Could not submit your documents"));
    } finally {
      setSubmitting(false);
    }
  });

  const err = (m?: string) =>
    m ? (
      <p className="text-xs font-medium text-destructive" role="alert">
        {m}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-xl border bg-card p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">Submit your ID</h2>
        <p className="text-sm text-muted-foreground">
          Signed in as {user?.email}. The name should match the document.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${uid}-name`}>Full name (as on document)</Label>
        <Input
          id={`${uid}-name`}
          autoComplete="name"
          maxLength={80}
          aria-invalid={Boolean(errors.fullName) || undefined}
          {...register("fullName")}
        />
        {err(errors.fullName?.message)}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${uid}-type`}>Document type</Label>
          <Controller
            control={control}
            name="documentType"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger
                  id={`${uid}-type`}
                  className="h-10 rounded-lg"
                  aria-invalid={Boolean(errors.documentType) || undefined}
                >
                  <SelectValue placeholder="Choose a document" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {err(errors.documentType ? "Choose a document type" : undefined)}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${uid}-last4`}>Last 4 characters of document number</Label>
          <Input
            id={`${uid}-last4`}
            maxLength={4}
            autoComplete="off"
            placeholder="e.g. 4821"
            className="font-mono uppercase tracking-widest"
            aria-invalid={Boolean(errors.documentLast4) || undefined}
            aria-describedby={`${uid}-last4-hint`}
            {...register("documentLast4")}
          />
          {errors.documentLast4 ? (
            err(errors.documentLast4.message)
          ) : (
            <p id={`${uid}-last4-hint`} className="text-xs text-muted-foreground">
              Only the last 4 — please don&apos;t type the full number.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${uid}-file`}>Document photo or PDF</Label>
        <input
          ref={fileRef}
          id={`${uid}-file`}
          type="file"
          accept={ACCEPT.join(",")}
          className="sr-only"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <FileCheck2 className="size-5 shrink-0 text-success" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove file"
              onClick={() => {
                setFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              <X />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={cn(
              "flex w-full flex-col items-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              fileError && "border-destructive"
            )}
          >
            <FileUp className="size-6 text-primary" />
            <span className="text-sm font-medium">Choose file</span>
            <span className="text-xs text-muted-foreground">JPG, PNG, WebP or PDF · max 8 MB</span>
          </button>
        )}
        {err(fileError ?? undefined)}
      </div>

      <Button type="submit" loading={submitting} className="w-full sm:w-auto">
        <ShieldCheck /> Submit for verification
      </Button>
    </form>
  );
}

export function VerificationView() {
  const { reloadUser } = useAuth();
  const { refresh } = useDashboard();
  const [verification, setVerification] = useState<Verification | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setVerification(await authed(() => api<Verification | null>("/api/auth/verify-owner")));
    } catch (err) {
      setError(errorMessage(err, "Could not load your verification status"));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <DashboardHeading
        title="Owner verification"
        description="Verify your identity once to earn the Verified owner badge."
      />

      {error ? (
        <EmptyState
          icon={RefreshCw}
          title="Couldn't load your status"
          description={error}
          action={<Button onClick={() => void load()}>Try again</Button>}
        />
      ) : verification === undefined ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <>
          {verification ? <StatusCard v={verification} /> : null}
          {!verification || verification.status === "REJECTED" ? (
            <>
              {!verification ? (
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Sparkles className="size-4" /> Why get verified?
                </div>
              ) : null}
              {!verification ? <WhyVerify /> : null}
              <PrivacyNote />
              <VerificationForm
                onSubmitted={(v) => {
                  setVerification(v);
                  void reloadUser();
                  void refresh();
                }}
              />
            </>
          ) : (
            <PrivacyNote />
          )}
        </>
      )}
    </div>
  );
}
