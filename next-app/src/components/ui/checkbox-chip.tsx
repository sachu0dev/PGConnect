"use client";
import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Toggleable pill used for filters and multi-select options. */
export function CheckboxChip({
  checked,
  onCheckedChange,
  children,
  className,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
        checked
          ? "border-primary bg-primary/10 text-primary"
          : "border-input bg-background text-foreground hover:bg-accent",
        className
      )}
    >
      {checked ? <Check className="size-3.5" /> : null}
      {children}
    </button>
  );
}
