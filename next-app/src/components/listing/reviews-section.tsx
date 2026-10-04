import { MessageSquareQuote } from "lucide-react";
import { ReviewsList } from "./reviews-list";
import { Stars } from "./stars";
import { WriteReview } from "./write-review";
import type { ReviewPage } from "./types";

export function ReviewsSection({ pgId, pgName, data }: { pgId: string; pgName: string; data: ReviewPage }) {
  const { summary } = data;
  const listKey = `${summary.reviewCount}:${summary.avgRating}:${data.items[0]?.id ?? ""}`;

  return (
    <section aria-labelledby="reviews-heading" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="reviews-heading" className="text-xl font-bold">
          Reviews {summary.reviewCount > 0 ? <span className="text-muted-foreground">({summary.reviewCount})</span> : null}
        </h2>
        <WriteReview pgName={pgName} />
      </div>

      {summary.reviewCount > 0 ? (
        <>
          <div className="grid gap-6 rounded-xl border bg-card p-5 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="text-center sm:pr-6">
              <p className="text-4xl font-extrabold">{summary.avgRating.toFixed(1)}</p>
              <Stars value={summary.avgRating} className="mt-1" />
              <p className="mt-1 text-xs text-muted-foreground">
                {summary.reviewCount} {summary.reviewCount === 1 ? "review" : "reviews"}
              </p>
            </div>
            <ul className="space-y-1.5" aria-label="Rating breakdown">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const count = summary.distribution[star];
                const pct = summary.reviewCount ? Math.round((count / summary.reviewCount) * 100) : 0;
                return (
                  <li key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-right font-medium">{star}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <span className="block h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="w-8 text-muted-foreground">
                      {count}
                      <span className="sr-only"> reviews with {star} stars</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <ReviewsList key={listKey} pgId={pgId} initial={data} />
        </>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
          <MessageSquareQuote className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <p>
            No reviews yet. Reviews on PGConnect come only from people who chatted with the owner or requested a
            callback or visit — so they&apos;re from real enquiries.
          </p>
        </div>
      )}
    </section>
  );
}
