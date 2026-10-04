"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Spinner } from "@/components/ui/spinner";
import { api, errorMessage } from "@/lib/api-client";
import type { AuthResponse } from "@/lib/types";

const GOOGLE_ENABLED = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

/**
 * "Continue with Google" + divider. Renders nothing unless the Google client id
 * is configured (the OAuth provider is only mounted in that case).
 */
export function GoogleSignIn({ next, text = "continue_with" }: { next: string; text?: "continue_with" | "signup_with" | "signin_with" }) {
  if (!GOOGLE_ENABLED) return null;
  return <GoogleSignInInner next={next} text={text} />;
}

function GoogleSignInInner({ next, text }: { next: string; text: "continue_with" | "signup_with" | "signin_with" }) {
  const { completeLogin } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-5">
      <div className="relative flex min-h-11 justify-center">
        <GoogleLogin
          text={text}
          shape="rectangular"
          size="large"
          width="320"
          logo_alignment="center"
          onSuccess={async ({ credential }) => {
            if (!credential) {
              toast.error("Google sign-in failed. Please try again.");
              return;
            }
            setPending(true);
            try {
              const res = await api<AuthResponse>("/api/auth/google", { method: "POST", body: { credential } });
              completeLogin(res);
              toast.success(`Welcome, ${res.user.username}!`);
              router.replace(next);
            } catch (error) {
              toast.error(errorMessage(error, "Google sign-in failed. Please try again."));
              setPending(false);
            }
          }}
          onError={() => toast.error("Google sign-in was cancelled or failed. Please try again.")}
        />
        {pending ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80">
            <Spinner className="size-5 text-primary" label="Signing you in" />
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or with email
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
