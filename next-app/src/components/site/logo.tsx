import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-bold tracking-tight", className)} aria-label="PGConnect home">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M3 10.5 12 4l9 6.5" />
          <path d="M5 9.5V20h14V9.5" />
          <path d="M9 20v-5a3 3 0 0 1 6 0v5" />
        </svg>
      </span>
      <span className="text-lg">
        PG<span className="text-primary">Connect</span>
      </span>
    </Link>
  );
}
