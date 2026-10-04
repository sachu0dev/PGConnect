import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthFormSkeleton } from "@/components/auth/auth-form-skeleton";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Join PGConnect for free to find verified PGs and co-living spaces with zero brokerage.",
  alternates: { canonical: "/register" },
};

export default function Page() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <RegisterForm />
    </Suspense>
  );
}
