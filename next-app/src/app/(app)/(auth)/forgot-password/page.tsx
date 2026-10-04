import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your PGConnect password with a one-time code sent to your email.",
  alternates: { canonical: "/forgot-password" },
};

export default function Page() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
