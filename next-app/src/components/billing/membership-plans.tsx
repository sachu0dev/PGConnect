"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AlertTriangle, Check, Clock3, Crown, Mail, ReceiptText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { api, ApiClientError, errorMessage } from "@/lib/api-client";
import { PLANS, SUPPORT_EMAIL, type PlanId } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CancelResult, CheckoutSession, SubscriptionInfo } from "@/server/billing";
import { loadRazorpay } from "./razorpay";

type Current = { subscription: SubscriptionInfo | null; membership: PlanId; paymentsEnabled: boolean };
type PaidPlan = "BASIC" | "PREMIUM";

const PLAN_ORDER: PlanId[] = ["FREE", "BASIC", "PREMIUM"];
const BRAND_COLOR = "#1b8876";
const fmtDate = (iso: string | null) => (iso ? format(new Date(iso), "d MMM yyyy") : "—");

function ComingSoon() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-secondary/60 p-4 sm:flex-row sm:items-center">
      <Sparkles className="size-5 shrink-0 text-primary" />
      <p className="flex-1 text-sm">
        Online payments are coming soon. Want a paid plan today? Contact support and we&apos;ll set it up for you.
      </p>
      <Button size="sm" variant="outline" asChild>
        <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Upgrade my PGConnect plan")}`}>
          <Mail /> Contact support
        </a>
      </Button>
    </div>
  );
}

function CurrentSubscription({
  sub,
  onCancel,
  onResume,
  resuming,
}: {
  sub: SubscriptionInfo;
  onCancel: () => void;
  onResume: () => void;
  resuming: boolean;
}) {
  if (sub.status === "PENDING") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center">
        <Clock3 className="size-5 shrink-0" />
        <p className="flex-1 text-sm">
          Your {sub.planName} plan payment wasn&apos;t completed. If money was debited, it will reflect within a few
          minutes — otherwise you can complete the payment now.
        </p>
        <div className="flex gap-2">
          <Button size="sm" onClick={onResume} loading={resuming}>
            Complete payment
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Discard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm" aria-labelledby="current-sub-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="current-sub-heading" className="flex items-center gap-2 text-lg font-semibold">
            <ReceiptText className="size-5 text-primary" /> Your subscription
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {sub.planName} plan · {formatINR(sub.amount)}/month (plus applicable taxes)
          </p>
        </div>
        <Badge variant={sub.cancelAtPeriodEnd ? "warning" : "success"}>
          {sub.cancelAtPeriodEnd ? "Cancelled — ends soon" : "Active"}
        </Badge>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Started</dt>
          <dd className="font-medium">{fmtDate(sub.startDate)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Last payment</dt>
          <dd className="font-medium">{fmtDate(sub.lastPaymentDate)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{sub.cancelAtPeriodEnd ? "Plan ends on" : "Renews on"}</dt>
          <dd className="font-medium">{fmtDate(sub.endDate)}</dd>
        </div>
      </dl>
      {sub.cancelAtPeriodEnd ? (
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          You won&apos;t be charged again. After {fmtDate(sub.endDate)} you&apos;ll move to the free{" "}
          {PLANS.FREE.name} plan and listings beyond its limit will be paused (not deleted).
        </p>
      ) : (
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel subscription
          </Button>
        </div>
      )}
    </section>
  );
}

export function MembershipPlans() {
  const { user, status, reloadUser } = useAuth();
  const router = useRouter();
  const [current, setCurrent] = useState<Current | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [busyPlan, setBusyPlan] = useState<PaidPlan | null>(null);
  const [comingSoon, setComingSoon] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const loadCurrent = useCallback(async () => {
    setLoadingCurrent(true);
    try {
      const data = await api<Current>("/api/subscriptions/current");
      setCurrent(data);
      if (!data.paymentsEnabled) setComingSoon(true);
    } catch {
      setCurrent(null);
    } finally {
      setLoadingCurrent(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void loadCurrent();
  }, [status, loadCurrent]);

  const membership: PlanId = current?.membership ?? user?.membership ?? "FREE";
  const activeSub = current?.subscription?.status === "ACTIVE" ? current.subscription : null;

  const subscribe = async (plan: PaidPlan) => {
    if (status !== "authenticated") {
      router.push(`/login?next=${encodeURIComponent("/membership")}`);
      return;
    }
    setBusyPlan(plan);
    let session: CheckoutSession;
    try {
      session = await api<CheckoutSession>("/api/subscriptions/create", { method: "POST", body: { plan } });
    } catch (error) {
      setBusyPlan(null);
      if (error instanceof ApiClientError && error.status === 503) {
        setComingSoon(true);
        toast.info("Online payments are coming soon — please contact support to upgrade.");
      } else {
        toast.error(errorMessage(error, "Couldn't start the payment"));
      }
      return;
    }

    try {
      const Razorpay = await loadRazorpay();
      let failedReason: string | null = null;
      let completed = false;
      const checkout = new Razorpay({
        key: session.keyId,
        subscription_id: session.subscriptionId,
        name: "PGConnect",
        description: `${session.planName} plan — monthly subscription`,
        prefill: {
          name: session.prefill.name,
          email: session.prefill.email,
          ...(session.prefill.contact ? { contact: `+91${session.prefill.contact}` } : {}),
        },
        notes: { plan: session.plan },
        theme: { color: BRAND_COLOR },
        handler: async (response) => {
          completed = true;
          const verifying = toast.loading("Confirming your payment…");
          try {
            await api("/api/subscriptions/verify", { method: "POST", body: response });
            toast.success(`Welcome to ${session.planName}! Your plan is active.`, { id: verifying });
            await reloadUser();
            router.push(`/payment/success?plan=${session.plan}`);
          } catch (error) {
            toast.error(errorMessage(error, "We couldn't confirm the payment"), { id: verifying });
            router.push(`/payment/failure?reason=verify&payment=${encodeURIComponent(response.razorpay_payment_id)}`);
          } finally {
            setBusyPlan(null);
          }
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setBusyPlan(null);
            if (completed) return;
            if (failedReason) {
              router.push(`/payment/failure?reason=${encodeURIComponent(failedReason)}`);
            } else {
              toast("Payment cancelled. You can upgrade anytime.");
              void loadCurrent();
            }
          },
        },
      });
      checkout.on("payment.failed", (response) => {
        failedReason = response.error?.description ?? "Payment failed";
        toast.error(`${failedReason}. You can retry or use another payment method.`);
      });
      checkout.open();
    } catch (error) {
      setBusyPlan(null);
      toast.error(errorMessage(error, "Couldn't open the payment window"));
    }
  };

  const cancel = async () => {
    const sub = current?.subscription;
    if (!sub) return;
    try {
      const result = await api<CancelResult>("/api/subscriptions/cancel", {
        method: "POST",
        body: { subscriptionId: sub.id },
      });
      if (result.endsAt) {
        toast.success(`Subscription cancelled. Your plan stays active until ${fmtDate(result.endsAt)}.`);
      } else if (result.pausedListings > 0) {
        toast.success(
          `Subscription cancelled. ${result.pausedListings} listing${result.pausedListings === 1 ? " was" : "s were"} paused to fit the free plan — you can choose which ones stay live from My listings.`,
          { duration: 8000 }
        );
      } else {
        toast.success(sub.status === "PENDING" ? "Pending payment discarded" : "Subscription cancelled");
      }
      await Promise.all([loadCurrent(), reloadUser()]);
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't cancel the subscription"));
      return false;
    }
  };

  const cancelDescription = (() => {
    const sub = current?.subscription;
    if (!sub) return null;
    if (sub.status === "PENDING") return "This unfinished payment will be discarded. You won't be charged.";
    return (
      <>
        Your {sub.planName} plan won&apos;t renew and you won&apos;t be charged again. You keep its benefits until{" "}
        <strong className="text-foreground">{fmtDate(sub.endDate)}</strong>. After that you move to the free{" "}
        {PLANS.FREE.name} plan ({PLANS.FREE.listingLimit} live listing) and the rest of your listings are paused — not
        deleted. Payments already made aren&apos;t refunded pro-rata — see our{" "}
        <Link href="/refund-policy" className="text-primary underline-offset-4 hover:underline">
          refund policy
        </Link>
        .
      </>
    );
  })();

  return (
    <div className="space-y-8">
      {comingSoon ? <ComingSoon /> : null}

      {status === "authenticated" && loadingCurrent && !current ? (
        <Skeleton className="h-36 rounded-xl" />
      ) : current?.subscription ? (
        <CurrentSubscription
          sub={current.subscription}
          onCancel={() => setConfirmCancel(true)}
          onResume={() => void subscribe(current.subscription!.plan)}
          resuming={busyPlan !== null}
        />
      ) : null}

      <ul className="grid gap-5 lg:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const isCurrent = status === "authenticated" && membership === id;
          const paid = id !== "FREE";
          return (
            <li
              key={id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
                isCurrent
                  ? "border-primary ring-2 ring-primary"
                  : plan.highlighted && "border-primary/50"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  {id === "PREMIUM" ? <Crown className="size-5 text-amber-500" /> : null}
                  {plan.name}
                </h2>
                {isCurrent ? (
                  <Badge>Current plan</Badge>
                ) : plan.highlighted ? (
                  <Badge variant="secondary">Most popular</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              <p className="mt-5">
                <span className="text-3xl font-bold tracking-tight">
                  {plan.priceMonthly === 0 ? "₹0" : formatINR(plan.priceMonthly)}
                </span>
                <span className="text-sm text-muted-foreground">/month</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {plan.listingLimit === 1 ? "1 live listing" : `Up to ${plan.listingLimit} live listings`}
                {paid ? " · billed monthly, plus applicable taxes" : " · free forever"}
              </p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {!paid ? (
                  isCurrent ? (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/dashboard">Go to dashboard</Link>
                    </Button>
                  ) : status === "authenticated" ? (
                    <p className="text-center text-xs text-muted-foreground">
                      Cancel your paid plan to move back to {plan.name}.
                    </p>
                  ) : (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/owners">List your PG free</Link>
                    </Button>
                  )
                ) : isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    <Check /> You&apos;re on {plan.name}
                  </Button>
                ) : activeSub ? (
                  <Button variant="outline" className="w-full" disabled title="Cancel your current plan first">
                    Available after your current plan ends
                  </Button>
                ) : comingSoon ? (
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Upgrade to ${plan.name}`)}`}>
                      <Mail /> Contact us to upgrade
                    </a>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "secondary"}
                    onClick={() => void subscribe(id as PaidPlan)}
                    loading={busyPlan === id}
                    disabled={status === "loading" || (busyPlan !== null && busyPlan !== id)}
                  >
                    {status === "authenticated" ? `Upgrade to ${plan.name}` : `Log in to choose ${plan.name}`}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {status === "authenticated" && !user?.isOwner ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="size-4 text-warning" />
          Plans are for PG owners.{" "}
          <Link href="/owners" className="font-medium text-primary hover:underline">
            Start listing your PG
          </Link>{" "}
          first — the free plan is enough to begin.
        </p>
      ) : null}

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title={current?.subscription?.status === "PENDING" ? "Discard this payment?" : "Cancel your subscription?"}
        description={cancelDescription}
        confirmLabel={current?.subscription?.status === "PENDING" ? "Discard" : "Cancel subscription"}
        cancelLabel="Keep plan"
        destructive
        onConfirm={cancel}
      />
    </div>
  );
}
