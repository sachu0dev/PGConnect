"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type SearchNavigation = { navigate: (href: string) => void; pending: boolean };

const SearchNavigationContext = createContext<SearchNavigation | null>(null);

/** Shares one transition between all filter controls so results can show a pending state. */
export function SearchNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = (href: string) => startTransition(() => router.push(href, { scroll: false }));
  return (
    <SearchNavigationContext.Provider value={{ navigate, pending }}>{children}</SearchNavigationContext.Provider>
  );
}

export function useSearchNavigation(): SearchNavigation {
  const ctx = useContext(SearchNavigationContext);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (ctx) return ctx;
  return { navigate: (href) => startTransition(() => router.push(href)), pending };
}

/** Dims the results while a filter change is loading. */
export function PendingArea({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useSearchNavigation();
  return (
    <div
      aria-busy={pending || undefined}
      className={cn("transition-opacity duration-200", pending && "pointer-events-none opacity-50", className)}
    >
      {children}
    </div>
  );
}
