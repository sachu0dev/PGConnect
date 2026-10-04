"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api-client";
import type { AuthResponse } from "@/lib/types";
import { resetPasswordSchema } from "@/lib/validation";
import { AuthHeader } from "./auth-header";
import { OtpField } from "./otp-field";
import { PasswordInput } from "./password-input";
import { PasswordStrength } from "./password-strength";
import { useCooldown } from "./use-cooldown";
import { applyServerErrors, authHref, errorDetail, safeNext } from "./utils";

type Values = z.input<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const router = useRouter();
  const { completeLogin } = useAuth();
  const initialEmail = searchParams.get("email") ?? "";
  const cooldown = useCooldown(initialEmail ? 60 : 0);

  const form = useForm<Values>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: initialEmail, code: "", password: "" },
    mode: "onTouched",
  });
  const password = useWatch({ control: form.control, name: "password" });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const res = await api<AuthResponse>("/api/auth/reset-password", { method: "POST", body: values });
      completeLogin(res);
      toast.success("Password updated. You're now logged in.");
      router.replace(next);
    } catch (error) {
      if (errorDetail(error, "needsResend")) {
        form.setValue("code", "");
        form.setError("code", { type: "server", message: errorMessage(error) }, { shouldFocus: true });
        return;
      }
      if (applyServerErrors(error, form.setError, ["email", "code", "password"])) return;
      toast.error(errorMessage(error));
    }
  });

  const resend = async () => {
    const valid = await form.trigger("email");
    if (!valid) return;
    try {
      await api("/api/auth/forgot-password", { method: "POST", body: { email: form.getValues("email") } });
      toast.success("If an account exists for this email, a new code is on its way.");
      form.setValue("code", "");
      form.clearErrors("code");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      cooldown.start(60);
    }
  };

  return (
    <>
      <AuthHeader
        icon={LockKeyhole}
        title="Set a new password"
        description="Enter the 6-digit code we emailed you and choose a new password. You'll be signed out of other devices."
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
                  <Input type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field, fieldState }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-2">
                  <FormLabel>Reset code</FormLabel>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={resend}
                    disabled={cooldown.active}
                  >
                    {cooldown.active ? `Resend in ${cooldown.seconds}s` : "Resend code"}
                  </Button>
                </div>
                <FormControl>
                  <OtpField
                    value={field.value}
                    onChange={field.onChange}
                    invalid={Boolean(fieldState.error)}
                    autoFocus={Boolean(initialEmail)}
                  />
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
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" placeholder="Create a new password" {...field} />
                </FormControl>
                <PasswordStrength password={password ?? ""} />
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="w-full" loading={form.formState.isSubmitting}>
            Update password & log in
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href={authHref("/login", next)} className="font-semibold text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </>
  );
}
