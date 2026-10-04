import type { LucideIcon } from "lucide-react";

/** Title block used at the top of every auth form. */
export function AuthHeader({
  icon: Icon,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="mb-6 space-y-2">
      {Icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-6" aria-hidden />
        </div>
      ) : null}
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground sm:text-base">{description}</p> : null}
    </div>
  );
}
