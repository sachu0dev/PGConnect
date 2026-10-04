import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildHref, type FilterState } from "./search-url";

function pageWindow(current: number, total: number): (number | "gap")[] {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

/** Crawlable numbered pagination built from real links. */
export function SearchPagination({
  state,
  page,
  totalPages,
}: {
  state: FilterState;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const href = (p: number) => buildHref("/pgs", { ...state, page: p > 1 ? p : undefined });
  const linkClass = (active = false) =>
    cn(buttonVariants({ variant: active ? "default" : "ghost", size: "icon" }), "rounded-lg");

  return (
    <nav aria-label="Search results pages" className="flex items-center justify-center gap-1 pt-4">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={cn(buttonVariants({ variant: "outline" }), "px-3")}>
          <ChevronLeft /> <span className="hidden sm:inline">Previous</span>
        </Link>
      ) : null}
      <ul className="flex items-center gap-1">
        {pageWindow(page, totalPages).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} className="px-1 text-muted-foreground" aria-hidden>
              …
            </li>
          ) : (
            <li key={p}>
              <Link href={href(p)} aria-current={p === page ? "page" : undefined} className={linkClass(p === page)}>
                {p}
              </Link>
            </li>
          )
        )}
      </ul>
      {page < totalPages ? (
        <Link href={href(page + 1)} rel="next" className={cn(buttonVariants({ variant: "outline" }), "px-3")}>
          <span className="hidden sm:inline">Next</span> <ChevronRight />
        </Link>
      ) : null}
    </nav>
  );
}
