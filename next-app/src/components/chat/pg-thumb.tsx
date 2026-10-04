import Image from "next/image";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small square PG photo with an icon fallback. */
export function PgThumb({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-primary",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <Building2 className="size-1/2" aria-hidden />
      )}
    </span>
  );
}
