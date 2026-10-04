import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Readable long-form typography without @tailwindcss/typography.
 * Styles direct HTML descendants (h2/h3/p/ul/ol/a/strong/table).
 */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-none text-[15px] leading-7 text-foreground/90 sm:text-base",
        "[&_h2]:mt-12 [&_h2]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground sm:[&_h2]:text-2xl",
        "[&_h3]:mt-8 [&_h3]:scroll-mt-24 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground",
        "[&_p]:mt-4 [&_ul]:mt-4 [&_ol]:mt-4",
        "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6",
        "[&_li]:pl-1 [&_li::marker]:text-muted-foreground",
        "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary/80",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_table]:mt-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
        "[&_th]:border [&_th]:bg-muted/60 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold",
        "[&_td]:border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top",
        "[&>*:first-child]:mt-0",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Highlighted summary / notice box inside legal pages. */
export function Callout({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm leading-6 sm:p-5 [&_p]:mt-2 [&>*:first-child]:mt-0">
      {title ? <p className="font-semibold text-foreground">{title}</p> : null}
      {children}
    </div>
  );
}
