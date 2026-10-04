import type { Metadata } from "next";
import Link from "next/link";
import { MembershipPlans } from "@/components/billing/membership-plans";
import { PLANS, SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Plans & pricing for PG owners",
  description: `List your first PG free on PGConnect. Upgrade to ${PLANS.BASIC.name} or ${PLANS.PREMIUM.name} to list more properties and get priority placement. Monthly plans, cancel anytime.`,
  alternates: { canonical: "/membership" },
};

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: (
      <>
        Yes. Cancel from this page whenever you like — your plan simply stops renewing. You keep the paid features until
        the end of the month you&apos;ve already paid for, then move to the free {PLANS.FREE.name} plan. Listings above
        the free limit are paused, not deleted.
      </>
    ),
  },
  {
    q: "Are taxes included in the price?",
    a: <>Prices shown are per month and exclusive of applicable taxes, which are added at checkout.</>,
  },
  {
    q: "How do I pay?",
    a: (
      <>
        Payments are processed securely by Razorpay — UPI, cards and other supported methods. Plans renew monthly until
        you cancel. We never see or store your card details.
      </>
    ),
  },
  {
    q: "Can I switch between plans?",
    a: (
      <>
        To move to a different paid plan, cancel your current plan first; you can subscribe to the new plan once the
        current billing period ends.
      </>
    ),
  },
  {
    q: "Do you offer refunds?",
    a: (
      <>
        Duplicate charges, failed activations and charges after cancellation are refunded in full. See our{" "}
        <Link href="/refund-policy" className="text-primary underline-offset-4 hover:underline">
          refund policy
        </Link>{" "}
        for details, or write to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary underline-offset-4 hover:underline">
          {SUPPORT_EMAIL}
        </a>
        .
      </>
    ),
  },
];

export default function MembershipPage() {
  return (
    <div className="container py-10 md:py-14">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Plans & pricing</p>
        <h1 className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Simple plans for PG owners
        </h1>
        <p className="mt-3 text-muted-foreground">
          Start free with one listing. Upgrade when you have more properties to fill. No brokerage, no commission.
        </p>
      </header>

      <div className="mx-auto mt-10 max-w-6xl">
        <MembershipPlans />
      </div>

      <section className="mx-auto mt-16 max-w-3xl" aria-labelledby="pricing-faq">
        <h2 id="pricing-faq" className="text-2xl font-bold tracking-tight">
          Frequently asked questions
        </h2>
        <div className="mt-5 divide-y rounded-xl border bg-card">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {f.q}
                <span className="text-xl leading-none text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
