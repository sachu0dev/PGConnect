"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { BadgeCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { applyServerErrors } from "@/components/auth/utils";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { api, errorMessage } from "@/lib/api-client";
import type { PublicUser } from "@/lib/types";
import { profileSchema } from "@/lib/validation";
import { SectionCard } from "./section-card";

type Values = z.input<typeof profileSchema>;

export function ProfileForm({ user }: { user: PublicUser }) {
  const { setUser } = useAuth();
  const form = useForm<Values>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: user.username, phoneNumber: user.phoneNumber ?? "" },
    mode: "onTouched",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const updated = await api<PublicUser>("/api/account", {
        method: "PATCH",
        body: { username: values.username, phoneNumber: values.phoneNumber ?? "" },
      });
      setUser(updated);
      form.reset({ username: updated.username, phoneNumber: updated.phoneNumber ?? "" });
      toast.success("Profile updated");
    } catch (error) {
      if (applyServerErrors(error, form.setError, ["username", "phoneNumber"])) return;
      toast.error(errorMessage(error));
    }
  });

  return (
    <SectionCard icon={UserRound} title="Profile" description="How you appear to PG owners when you chat or enquire.">
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="account-email">Email</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Input id="account-email" value={user.email} readOnly disabled className="max-w-sm flex-1" />
              {user.isVerified ? (
                <Badge variant="success">
                  <BadgeCheck /> Verified
                </Badge>
              ) : null}
            </div>
            <p className="text-[0.8rem] text-muted-foreground">Your email can&apos;t be changed. It&apos;s never shown to owners.</p>
          </div>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input autoComplete="username" autoCapitalize="none" className="max-w-sm" {...field} value={field.value ?? ""} />
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
                <div className="flex max-w-sm">
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
                <FormDescription>Pre-filled when you request a callback or visit. Leave empty to remove.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" loading={form.formState.isSubmitting} disabled={!form.formState.isDirty}>
            Save changes
          </Button>
        </form>
      </Form>
    </SectionCard>
  );
}
