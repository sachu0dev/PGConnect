"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, errorMessage } from "@/lib/api-client";
import type { AuthResponse } from "@/lib/types";
import { emailSchema } from "@/lib/validation";
import { AuthHeader } from "./auth-header";
import { OtpField } from "./otp-field";
import { useCooldown } from "./use-cooldown";
import { useRedirectIfAuthenticated } from "./use-redirect-if-authenticated";
import { authHref, errorDetail, safeNext } from "./utils";

const RESEND_SECONDS = 60;

export function VerifyForm() {
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const initialEmail = emailSchema.safeParse(searchParams.get("email") ?? "");
  const [email, setEmail] = useState(initialEmail.success ? initialEmail.data : "");

  useRedirectIfAuthenticated(next);

  if (!email) return <EmailStep next={next} onSubmit={setEmail} />;
  return <CodeStep key={email} email={email} next={next} sentOnArrival={initialEmail.success} />;
}

function EmailStep({ next, onSubmit }: { next: string; onSubmit: (email: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = emailSchema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? "Enter a valid email address");
      return;
    }
    setPending(true);
    try {
      await api("/api/auth/resend-code", { method: "POST", body: { email: parsed.data } });
      toast.success("If your account is awaiting verification, a new code is on its way.");
      onSubmit(parsed.data);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <AuthHeader icon={MailCheck} title="Verify your email" description="Enter the email you signed up with and we'll send you a fresh code." />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="verify-email">Email</Label>
          <Input
            id="verify-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "verify-email-error" : undefined}
            placeholder="you@example.com"
          />
          {error ? (
            <p id="verify-email-error" className="text-[0.8rem] font-medium text-destructive">
              {error}
            </p>
          ) : null}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={pending}>
          Send code
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already verified?{" "}
        <Link href={authHref("/login", next)} className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}

const codeSchema = z.string().regex(/^\d{6}$/);

function CodeStep({ email, next, sentOnArrival }: { email: string; next: string; sentOnArrival: boolean }) {
  const router = useRouter();
  const { completeLogin } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const cooldown = useCooldown(sentOnArrival ? RESEND_SECONDS : 0);

  const verify = async (value: string) => {
    if (!codeSchema.safeParse(value).success) {
      setError("Enter the 6-digit code from your email");
      return;
    }
    if (verifying) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await api<AuthResponse>("/api/auth/verify-code", { method: "POST", body: { email, code: value } });
      completeLogin(res);
      toast.success("Email verified — welcome to PGConnect!");
      router.replace(next);
    } catch (err) {
      if (errorDetail(err, "alreadyVerified")) {
        toast.info("Your email is already verified. Please log in.");
        router.replace(authHref("/login", next, { email }));
        return;
      }
      setCode("");
      setError(errorMessage(err));
      setVerifying(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await api("/api/auth/resend-code", { method: "POST", body: { email } });
      toast.success("A new code is on its way. Check your inbox (and spam folder).");
      setCode("");
      setError(null);
      cooldown.start(RESEND_SECONDS);
    } catch (err) {
      toast.error(errorMessage(err));
      cooldown.start(RESEND_SECONDS);
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <AuthHeader
        icon={MailCheck}
        title="Check your email"
        description={
          <>
            We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>. It expires in 15 minutes.
          </>
        }
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          verify(code);
        }}
        className="space-y-5"
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="verify-code">Verification code</Label>
          <OtpField
            id="verify-code"
            value={code}
            onChange={(v) => {
              setCode(v);
              if (error) setError(null);
            }}
            onComplete={verify}
            disabled={verifying}
            invalid={Boolean(error)}
            autoFocus
            aria-describedby={error ? "verify-code-error" : undefined}
          />
          {error ? (
            <p id="verify-code-error" role="alert" className="text-[0.8rem] font-medium text-destructive">
              {error}
            </p>
          ) : null}
        </div>
        <Button type="submit" size="lg" className="w-full" loading={verifying}>
          Verify & continue
        </Button>
      </form>
      <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
        <p>
          Didn&apos;t get it?{" "}
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={resend}
            disabled={cooldown.active || resending}
            aria-live="polite"
          >
            {cooldown.active ? `Resend code in ${cooldown.seconds}s` : resending ? "Sending…" : "Resend code"}
          </Button>
        </p>
        <p>
          Wrong email?{" "}
          <Link href={authHref("/register", next)} className="font-semibold text-primary hover:underline">
            Sign up again
          </Link>
        </p>
      </div>
    </>
  );
}
