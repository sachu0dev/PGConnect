"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api-client";
import { emailOnlySchema } from "@/lib/validation";
import { AuthHeader } from "./auth-header";
import { applyServerErrors, authHref, safeNext } from "./utils";

type Values = z.input<typeof emailOnlySchema>;

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const router = useRouter();

  const form = useForm<Values>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: searchParams.get("email") ?? "" },
    mode: "onTouched",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { email } = await api<{ email: string }>("/api/auth/forgot-password", { method: "POST", body: values });
      toast.success("If an account exists for this email, we've sent a reset code.");
      router.push(authHref("/reset-password", next, { email }));
    } catch (error) {
      if (applyServerErrors(error, form.setError, ["email"])) return;
      toast.error(errorMessage(error));
    }
  });

  return (
    <>
      <AuthHeader
        icon={KeyRound}
        title="Forgot your password?"
        description="No worries. Enter your email and we'll send you a 6-digit code to set a new one."
      />
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full" loading={form.formState.isSubmitting}>
            Send reset code
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href={authHref("/login", next)} className="font-semibold text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </>
  );
}
