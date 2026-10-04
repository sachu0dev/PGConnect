"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api-client";
import { registerSchema } from "@/lib/validation";
import { AuthHeader } from "./auth-header";
import { GoogleSignIn } from "./google-sign-in";
import { PasswordInput } from "./password-input";
import { PasswordStrength } from "./password-strength";
import { useRedirectIfAuthenticated } from "./use-redirect-if-authenticated";
import { applyServerErrors, authHref, safeNext } from "./utils";

type RegisterValues = z.input<typeof registerSchema>;

export function RegisterForm() {
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const router = useRouter();
  useRedirectIfAuthenticated(next);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", phoneNumber: "", password: "" },
    mode: "onTouched",
  });
  const password = useWatch({ control: form.control, name: "password" });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { email } = await api<{ email: string }>("/api/auth/signup", { method: "POST", body: values });
      toast.success("Almost there! We've emailed you a 6-digit code.");
      router.push(authHref("/verify", next, { email }));
    } catch (error) {
      if (applyServerErrors(error, form.setError, ["username", "email", "phoneNumber", "password"])) return;
      if (errorMessage(error).includes("already exists")) {
        form.setError("email", { type: "server", message: errorMessage(error) }, { shouldFocus: true });
        return;
      }
      toast.error(errorMessage(error));
    }
  });

  return (
    <>
      <AuthHeader title="Create your account" description="Find verified PGs, chat with owners and book visits — no brokerage, ever." />
      <GoogleSignIn next={next} text="signup_with" />
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input autoComplete="username" autoCapitalize="none" placeholder="e.g. priya_s" {...field} />
                </FormControl>
                <FormDescription>Shown to PG owners when you chat. Letters, numbers and _ only.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Mobile number <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <div className="flex">
                  <span
                    className="inline-flex items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground"
                    aria-hidden
                  >
                    +91
                  </span>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="98765 43210"
                      className="rounded-l-none"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                </div>
                <FormDescription>Helps owners call you back faster. Never shown publicly.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" placeholder="Create a password" {...field} />
                </FormControl>
                <PasswordStrength password={password ?? ""} />
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full" loading={form.formState.isSubmitting}>
            Create account
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">Terms</Link> and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
          </p>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={authHref("/login", next)} className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
