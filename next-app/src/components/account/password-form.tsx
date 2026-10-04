"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { PasswordInput } from "@/components/auth/password-input";
import { PasswordStrength } from "@/components/auth/password-strength";
import { applyServerErrors } from "@/components/auth/utils";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { api, errorMessage, setAccessToken } from "@/lib/api-client";
import { changePasswordSchema } from "@/lib/validation";
import { SectionCard } from "./section-card";

const formSchema = changePasswordSchema
  .extend({ confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type Values = z.input<typeof formSchema>;

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const { reloadUser } = useAuth();
  const schema = hasPassword
    ? formSchema.refine((v) => Boolean(v.currentPassword), {
        message: "Enter your current password",
        path: ["currentPassword"],
      })
    : formSchema;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    mode: "onTouched",
  });
  const newPassword = useWatch({ control: form.control, name: "newPassword" });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { accessToken } = await api<{ accessToken: string }>("/api/account/password", {
        method: "POST",
        body: {
          currentPassword: hasPassword ? values.currentPassword : undefined,
          newPassword: values.newPassword,
        },
      });
      setAccessToken(accessToken);
      await reloadUser();
      form.reset();
      toast.success(hasPassword ? "Password changed. Other devices have been signed out." : "Password set. You can now log in with your email too.");
    } catch (error) {
      if (applyServerErrors(error, form.setError, ["currentPassword", "newPassword"])) return;
      toast.error(errorMessage(error));
    }
  });

  return (
    <SectionCard
      icon={KeyRound}
      title={hasPassword ? "Change password" : "Set a password"}
      description={
        hasPassword
          ? "Changing your password signs you out on all other devices."
          : "You sign in with Google. Add a password to also log in with your email."
      }
    >
      <Form {...form}>
        <form onSubmit={onSubmit} className="max-w-sm space-y-4" noValidate>
          {hasPassword ? (
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    <PasswordInput autoComplete="current-password" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <PasswordStrength password={newPassword ?? ""} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <PasswordInput autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" loading={form.formState.isSubmitting}>
            {hasPassword ? "Update password" : "Set password"}
          </Button>
        </form>
      </Form>
    </SectionCard>
  );
}
