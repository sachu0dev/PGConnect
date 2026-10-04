"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api, ApiClientError, errorMessage } from "@/lib/api-client";
import type { AuthResponse } from "@/lib/types";
import { loginSchema } from "@/lib/validation";
import { AuthHeader } from "./auth-header";
import { GoogleSignIn } from "./google-sign-in";
import { PasswordInput } from "./password-input";
import { useRedirectIfAuthenticated } from "./use-redirect-if-authenticated";
import { applyServerErrors, authHref, errorDetail, safeNext } from "./utils";

type LoginValues = z.input<typeof loginSchema>;

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const router = useRouter();
  const { completeLogin } = useAuth();
  useRedirectIfAuthenticated(next);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: searchParams.get("email") ?? "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const res = await api<AuthResponse>("/api/auth/login", { method: "POST", body: values });
      completeLogin(res);
      toast.success(`Welcome back, ${res.user.username}!`);
      router.replace(next);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 403 && errorDetail(error, "needsVerification")) {
        const email = String(errorDetail(error, "email") ?? values.email);
        toast.info("Please verify your email. We've sent you a fresh code.");
        router.push(authHref("/verify", next, { email }));
        return;
      }
      if (applyServerErrors(error, form.setError, ["email", "password"])) return;
      if (error instanceof ApiClientError && error.status === 401) {
        form.setError("password", { type: "server", message: error.message }, { shouldFocus: true });
        return;
      }
      toast.error(errorMessage(error));
    }
  });

  return (
    <>
      <AuthHeader title="Welcome back" description="Log in to chat with owners, save PGs and track your visit requests." />
      <GoogleSignIn next={next} text="signin_with" />
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href={authHref("/forgot-password", next, form.getValues("email") ? { email: form.getValues("email") } : {})}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput autoComplete="current-password" placeholder="Your password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full" loading={form.formState.isSubmitting}>
            Log in
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to PGConnect?{" "}
        <Link href={authHref("/register", next)} className="font-semibold text-primary hover:underline">
          Create a free account
        </Link>
      </p>
    </>
  );
}
