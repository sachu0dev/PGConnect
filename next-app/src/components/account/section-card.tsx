import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Consistent card wrapper for account settings sections. */
export function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  className,
  tone = "default",
}: {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "danger";
}) {
  return (
    <section
      className={cn(
        "rounded-xl border bg-card p-5 shadow-sm sm:p-6",
        tone === "danger" && "border-destructive/40",
        className
      )}
      aria-labelledby={`${title.replace(/\W+/g, "-").toLowerCase()}-title`}
    >
      <div className="mb-5 flex items-start gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            tone === "danger" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div>
          <h2 id={`${title.replace(/\W+/g, "-").toLowerCase()}-title`} className="text-lg font-semibold">
            {title}
          </h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}
