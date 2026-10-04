"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useBecomeOwner } from "./use-become-owner";

const NEXT = "/dashboard/post-pg";

/** "List your PG" call to action that adapts to the visitor's account state. */
export function OwnerCta({
  label = "List your PG for free",
  size = "lg",
  variant,
  className,
}: {
  label?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const { user, status } = useAuth();
  const { becomeOwner, pending } = useBecomeOwner(NEXT);

  if (status === "authenticated" && user && !user.isOwner) {
    return (
      <Button size={size} variant={variant} className={className} onClick={becomeOwner} loading={pending}>
        {label} {!pending ? <ArrowRight /> : null}
      </Button>
    );
  }

  const href = status === "authenticated" ? NEXT : `/register?next=${encodeURIComponent(NEXT)}`;
  return (
    <Button size={size} variant={variant} className={className} asChild aria-disabled={status === "loading" || undefined}>
      <Link href={href}>
        {label} <ArrowRight />
      </Link>
    </Button>
  );
}
