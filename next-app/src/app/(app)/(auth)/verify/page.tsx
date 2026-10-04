import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";
import { VerifyForm } from "@/components/auth/verify-form";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Enter the 6-digit code we emailed you to finish creating your PGConnect account.",
  alternates: { canonical: "/verify" },
};

export default function Page() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <VerifyForm />
    </Suspense>
  );
}
