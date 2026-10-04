"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api-client";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  pgId,
  initial = false,
  className,
  variant = "overlay",
  onChange,
}: {
  pgId: string;
  initial?: boolean;
  className?: string;
  variant?: "overlay" | "inline";
  onChange?: (saved: boolean) => void;
}) {
  const { status } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [pending, setPending] = useState(false);

  const toggle = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (status !== "authenticated") {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    const next = !saved;
    setSaved(next);
    setPending(true);
    try {
      await api(`/api/pg/${pgId}/favorite`, { method: next ? "POST" : "DELETE" });
      onChange?.(next);
      if (next) toast.success("Saved to your shortlist");
    } catch (error) {
      setSaved(!next);
      toast.error(errorMessage(error));
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save PG"}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-transform active:scale-90",
        variant === "overlay"
          ? "size-9 rounded-full bg-background/90 shadow-sm backdrop-blur hover:bg-background"
          : "h-10 rounded-lg border px-4 text-sm font-semibold hover:bg-accent",
        className
      )}
    >
      <Heart className={cn("size-[18px]", saved ? "fill-rose-500 text-rose-500" : "text-foreground")} />
      {variant === "inline" ? (saved ? "Saved" : "Save") : null}
    </button>
  );
}
