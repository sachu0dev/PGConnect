"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PenLine, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api, errorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useListingViewer } from "./viewer-provider";

const RATING_LABELS = ["", "Poor", "Below average", "Okay", "Good", "Excellent"];

/** Shown only to users who chatted with the owner or sent a callback / visit request. */
export function WriteReview({ pgName }: { pgName: string }) {
  const id = useId();
  const router = useRouter();
  const { pgId, state, update, loading, isOwner } = useListingViewer();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading || isOwner || !state.canReview) return null;
  const mine = state.myReview;

  const show = () => {
    setRating(mine?.rating ?? 0);
    setComment(mine?.comment ?? "");
    setError(null);
    setOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (rating < 1) {
      setError("Tap a star to rate this PG");
      return;
    }
    setSaving(true);
    try {
      await api(`/api/pg/${pgId}/reviews`, { method: "POST", body: { rating, comment: comment.trim() || undefined } });
      update({ myReview: { rating, comment: comment.trim() || null } });
      toast.success(mine ? "Your review has been updated" : "Thanks for your review!");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api(`/api/pg/${pgId}/reviews`, { method: "DELETE" });
      update({ myReview: null });
      toast.success("Your review has been deleted");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const shown = hover || rating;

  return (
    <>
      <Button variant={mine ? "outline" : "default"} onClick={show}>
        <PenLine /> {mine ? "Edit your review" : "Write a review"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mine ? "Edit your review" : "Review this PG"}</DialogTitle>
            <DialogDescription>How was your experience with {pgName}? Your review is public.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Your rating</legend>
              <div role="radiogroup" aria-label="Rating" className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} star${value > 1 ? "s" : ""} — ${RATING_LABELS[value]}`}
                    onClick={() => {
                      setRating(value);
                      setError(null);
                    }}
                    onMouseEnter={() => setHover(value)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowRight" || e.key === "ArrowUp") setRating(Math.min(5, (rating || 0) + 1));
                      if (e.key === "ArrowLeft" || e.key === "ArrowDown") setRating(Math.max(1, (rating || 2) - 1));
                    }}
                    className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Star
                      className={cn(
                        "size-8 transition-colors",
                        value <= shown ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/40"
                      )}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">{RATING_LABELS[shown]}</span>
              </div>
              {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
            </fieldset>
            <div className="space-y-1.5">
              <label htmlFor={`${id}-comment`} className="text-sm font-medium">
                Your review <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id={`${id}-comment`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Food, cleanliness, the owner, safety, the neighbourhood…"
              />
            </div>
            <DialogFooter className="gap-2">
              {mine ? (
                <Button type="button" variant="ghost" className="text-destructive sm:mr-auto" onClick={remove} loading={deleting}>
                  Delete review
                </Button>
              ) : null}
              <Button type="submit" loading={saving}>
                {mine ? "Save changes" : "Post review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
