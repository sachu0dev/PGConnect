"use client";

import { cn } from "@/lib/utils";

function score(password: string) {
  let s = 0;
  if (password.length >= 8) s++;
  if (password.length >= 12) s++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++;
  if (/\d/.test(password)) s++;
  if (/[^A-Za-z0-9]/.test(password)) s++;
  return Math.min(4, s);
}

const LEVELS = [
  { label: "Too weak", bar: "bg-destructive", text: "text-destructive" },
  { label: "Weak", bar: "bg-destructive", text: "text-destructive" },
  { label: "Okay", bar: "bg-warning", text: "text-warning-foreground dark:text-warning" },
  { label: "Good", bar: "bg-success", text: "text-success" },
  { label: "Strong", bar: "bg-success", text: "text-success" },
] as const;

/** Lightweight strength meter shown under new-password fields. */
export function PasswordStrength({ password, className }: { password: string; className?: string }) {
  if (!password) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        At least 8 characters with a letter and a number.
      </p>
    );
  }
  const s = score(password);
  const level = LEVELS[s]!;
  return (
    <div className={cn("space-y-1.5", className)} aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full bg-muted", i < s && level.bar)} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Password strength: <span className={cn("font-semibold", level.text)}>{level.label}</span>
        {s < 3 ? " — try a longer mix of upper & lower case, numbers and symbols." : null}
      </p>
    </div>
  );
}
