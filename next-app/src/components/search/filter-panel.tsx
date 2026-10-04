"use client";

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FilterFields } from "./filter-fields";
import { buildHref, clearFilters, countFilters, type FilterState } from "./search-url";
import { useSearchNavigation } from "./search-navigation";

const SEARCH_PATH = "/pgs";

function apply(state: FilterState, patch: Partial<FilterState>): FilterState {
  return { ...state, ...patch, page: undefined };
}

/** Desktop filter sidebar: every change updates the URL immediately. */
export function FilterSidebar({ state, className }: { state: FilterState; className?: string }) {
  const { navigate } = useSearchNavigation();
  const active = countFilters(state);
  return (
    <div className={cn("rounded-xl border bg-card p-5", className)}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <SlidersHorizontal className="size-4" /> Filters
        </h2>
        {active > 0 ? (
          <button
            type="button"
            onClick={() => navigate(buildHref(SEARCH_PATH, clearFilters(state)))}
            className="rounded text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear all
          </button>
        ) : null}
      </div>
      <FilterFields value={state} onChange={(patch) => navigate(buildHref(SEARCH_PATH, apply(state, patch)))} />
    </div>
  );
}

/** Mobile "Filters" button that opens a bottom sheet; changes apply on "Show results". */
export function MobileFilters({ state, className }: { state: FilterState; className?: string }) {
  const { navigate } = useSearchNavigation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterState>(state);
  const active = countFilters(state);

  const onOpenChange = (next: boolean) => {
    if (next) setDraft(state);
    setOpen(next);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="outline" className={cn("relative", className)}>
          <SlidersHorizontal />
          Filters
          {active > 0 ? (
            <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {active}
            </span>
          ) : null}
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-2xl border-t bg-background shadow-xl duration-300 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
          aria-describedby={undefined}
        >
          <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-muted" aria-hidden />
          <div className="flex items-center justify-between border-b px-4 py-3">
            <DialogPrimitive.Title className="text-base font-semibold">Filters</DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close filters">
                <X />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-5">
            <FilterFields value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
          </div>
          <div className="flex gap-2 border-t bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button variant="outline" className="flex-1" onClick={() => setDraft(clearFilters(draft))}>
              Clear all
            </Button>
            <Button
              className="flex-[2]"
              onClick={() => {
                setOpen(false);
                navigate(buildHref(SEARCH_PATH, apply(draft, {})));
              }}
            >
              Show results
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
