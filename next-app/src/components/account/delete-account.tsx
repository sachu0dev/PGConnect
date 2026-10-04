"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiClientError, errorMessage } from "@/lib/api-client";
import type { PublicUser } from "@/lib/types";
import { SectionCard } from "./section-card";

export function DeleteAccount({ user }: { user: PublicUser }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const canSubmit = confirm === "DELETE" && (!user.hasPassword || password.length > 0);

  const remove = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    setError(null);
    try {
      await api("/api/account", {
        method: "DELETE",
        body: { confirm: "DELETE", ...(user.hasPassword ? { password } : {}) },
      });
      await logout();
      toast.success("Your account has been deleted. We're sorry to see you go.");
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError && err.status === 400 ? err.message : errorMessage(err));
      setPending(false);
    }
  };

  return (
    <SectionCard
      icon={TriangleAlert}
      tone="danger"
      title="Delete account"
      description="Permanently delete your account and everything linked to it."
    >
      <p className="mb-4 text-sm text-muted-foreground">
        This removes your profile, saved PGs, chats, enquiries and reviews
        {user.isOwner ? ", plus all your PG listings and their photos" : ""}. Active plans are cancelled. This
        can&apos;t be undone.
      </p>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setConfirm("");
            setPassword("");
            setError(null);
          }
        }}
      >
        <DialogTrigger asChild>
          <Button variant="destructive">Delete my account</Button>
        </DialogTrigger>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-md">
          <form onSubmit={remove} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>
                All your data will be permanently removed. Type <strong className="text-foreground">DELETE</strong> to
                confirm.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">Type DELETE</Label>
              <Input
                id="delete-confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="off"
                autoCapitalize="characters"
              />
            </div>
            {user.hasPassword ? (
              <div className="space-y-2">
                <Label htmlFor="delete-password">Your password</Label>
                <PasswordInput
                  id="delete-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            ) : null}
            {error ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {error}
              </p>
            ) : null}
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" variant="destructive" disabled={!canSubmit} loading={pending}>
                Delete permanently
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
