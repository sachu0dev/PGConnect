import type { Metadata } from "next";
import Link from "next/link";
import { Mail, RotateCcw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Payment not completed",
  robots: { index: false, follow: false },
};

export default async function PaymentFailurePage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; payment?: string }>;
}) {
  const { reason, payment } = await searchParams;
  const isVerify = reason === "verify";
  const detail = !isVerify && reason ? reason.slice(0, 160) : null;
  const paymentId = payment && /^pay_[A-Za-z0-9]{6,40}$/.test(payment) ? payment : null;

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <XCircle className="size-9" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">
          {isVerify ? "We couldn't confirm your payment" : "Payment not completed"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isVerify
            ? "If money was debited, don't worry — your plan will be activated automatically once Razorpay confirms it, usually within a few minutes. Otherwise any debited amount is refunded as per our refund policy."
            : "The payment failed or was cancelled. If any amount was debited for a failed attempt, banks usually reverse it automatically. You can try again with another payment method."}
        </p>
        {detail ? <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm">Reason: {detail}</p> : null}
        {paymentId ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Payment ID: <span className="font-mono text-foreground">{paymentId}</span> — please mention it if you
            contact support.
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/membership">
              <RotateCcw /> {isVerify ? "Check my plan" : "Try again"}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Payment issue${paymentId ? ` ${paymentId}` : ""}`)}`}>
              <Mail /> Contact support
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
