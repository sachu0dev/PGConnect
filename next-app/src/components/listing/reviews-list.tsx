"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api-client";
import { initials } from "@/lib/format";
import { Stars } from "./stars";
import type { ReviewItem, ReviewPage } from "./types";

function timeAgo(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function ReviewsList({ pgId, initial }: { pgId: string; initial: ReviewPage }) {
  const [items, setItems] = useState<ReviewItem[]>(initial.items);
  const [page, setPage] = useState(initial.pagination.page);
  const [loading, setLoading] = useState(false);
  const hasMore = page < initial.pagination.totalPages;

  const loadMore = async () => {
    setLoading(true);
    try {
      const next = await api<ReviewPage>(`/api/pg/${pgId}/reviews`, { query: { page: page + 1 } });
      setItems((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        return [...prev, ...next.items.filter((r) => !seen.has(r.id))];
      });
      setPage(next.pagination.page);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ul className="divide-y">
        {items.map((review) => (
          <li key={review.id} className="py-4 first:pt-0">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                {initials(review.user.username)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{review.user.username}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Stars value={review.rating} size="size-3.5" />
                  <time dateTime={review.createdAt}>{timeAgo(review.createdAt)}</time>
                </div>
              </div>
            </div>
            {review.comment ? (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{review.comment}</p>
            ) : null}
          </li>
        ))}
      </ul>
      {hasMore ? (
        <Button variant="outline" onClick={loadMore} loading={loading}>
          Show more reviews
        </Button>
      ) : null}
    </div>
  );
}
