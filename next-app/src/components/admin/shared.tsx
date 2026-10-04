"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, TriangleAlert } from "lucide-react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, errorMessage } from "@/lib/api-client";
import type { Paginated } from "@/lib/types";
import { cn } from "@/lib/utils";

type Query = Record<string, string | number | undefined>;

/** Loads a paginated admin list and re-fetches whenever the query changes. */
export function useAdminList<T>(path: string, query: Query) {
  const [data, setData] = useState<Paginated<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const key = JSON.stringify(query);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api<Paginated<T>>(path, { query: JSON.parse(key) as Query, signal: controller.signal })
      .then((res) => setData(res))
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err, "Could not load data"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, key, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  /** Optimistically replaces one row after a successful mutation. */
  const updateItem = useCallback((match: (item: T) => boolean, next: T | null) => {
    setData((prev) => {
      if (!prev) return prev;
      const items = next
        ? prev.items.map((item) => (match(item) ? next : item))
        : prev.items.filter((item) => !match(item));
      const removed = prev.items.length - items.length;
      return { ...prev, items, pagination: { ...prev.pagination, total: prev.pagination.total - removed } };
    });
  }, []);

  return { data, loading, error, reload, updateItem };
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatusTabs<V extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: V;
  onChange: (value: V) => void;
  options: readonly { value: V; label: string }[];
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="mb-4 inline-flex max-w-full overflow-x-auto rounded-lg border bg-muted/50 p-1"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function AdminPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  if (total === 0) return null;
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        Page {page} of {totalPages} · {total.toLocaleString("en-IN")} total
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft /> Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <TriangleAlert className="size-6 text-destructive" />
      <p className="text-sm">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw /> Try again
      </Button>
    </div>
  );
}

/** Table on desktop; callers render a card list for mobile next to it. */
export function DataTable({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="hidden overflow-hidden rounded-xl border md:block">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {head.map((h, i) => (
              <th key={h || i} scope="col" className={cn("px-4 py-3 font-medium", i === head.length - 1 && "text-right")}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}

export function MobileCard({ children }: { children: ReactNode }) {
  return <li className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">{children}</li>;
}

export function DateCell({ value }: { value: string }) {
  const date = new Date(value);
  return (
    <time dateTime={value} title={format(date, "d MMM yyyy, h:mm a")} className="whitespace-nowrap text-muted-foreground">
      {formatDistanceToNowStrict(date, { addSuffix: true })}
    </time>
  );
}

export function SearchForm({
  initial,
  placeholder,
  onSearch,
}: {
  initial: string;
  placeholder: string;
  onSearch: (q: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <form
      role="search"
      className="flex w-full gap-2 sm:w-auto"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
    >
      <label htmlFor="admin-search" className="sr-only">
        {placeholder}
      </label>
      <input
        id="admin-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        maxLength={100}
        className="h-9 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-72 md:text-sm"
      />
      <Button type="submit" size="sm" className="h-9">
        Search
      </Button>
    </form>
  );
}
