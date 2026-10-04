import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Initials avatar (we don't store profile photos). */
export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary",
        className
      )}
    >
      {initials(name) || "?"}
    </span>
  );
}
