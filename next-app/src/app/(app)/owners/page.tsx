import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  BellRing,
  Building2,
  Camera,
  Check,
  IndianRupee,
  MessageSquareText,
  PauseCircle,
  PhoneCall,
  ShieldCheck,
  Smartphone,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OwnerCta } from "@/components/owner/owner-cta";
import { PLANS, type PlanId } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "List your PG for free — get tenant leads directly",
  description:
    "PG, hostel and co-living owners: list your property on PGConnect for free. Get callback and visit requests from tenants directly, chat in one inbox and earn a Verified owner badge. No brokerage.",
  alternates: { canonical: "/owners" },
  openGraph: {
    title: "List your PG for free on PGConnect",
    description: "Get tenant leads directly — callbacks, visit requests and chats. No brokerage.",
    url: "/owners",
  },
};

const BENEFITS = [
  {
    icon: IndianRupee,
    title: "Zero brokerage",
    text: "Tenants contact you directly. We don't take any commission on your rent.",
  },
  {
    icon: PhoneCall,
    title: "Callback & visit requests",
    text: "Interested tenants share their number and preferred visit date — straight to your dashboard and email.",
  },
  {
    icon: MessageSquareText,
    title: "One inbox for chats",
    text: "Answer questions about food, rules and availability without giving out your number to everyone.",
  },
  {
    icon: BadgeCheck,
    title: "Verified owner badge",
    text: "Verify your ID once and show tenants they're dealing with the genuine owner.",
  },
  {
    icon: PauseCircle,
    title: "Control availability",
    text: "Update free beds anytime, or pause your listing when the PG is full — no calls from tenants then.",
  },
  {
    icon: Smartphone,
    title: "Built for your phone",
    text: "Add photos from your gallery and manage everything from your mobile browser.",
  },
];

const STEPS = [
  { icon: UserPlus, title: "Create a free account", text: "Sign up with your email or Google in under a minute." },
  {
    icon: Camera,
    title: "Add your PG",
    text: "Rent, deposit, sharing options, food, amenities, house rules and at least 3 real photos.",
  },
  {
    icon: ShieldCheck,
    title: "Get verified (optional)",
    text: "Upload an ID — we store only the last 4 digits — to earn the Verified owner badge.",
  },
  {
    icon: BellRing,
    title: "Receive leads",
    text: "Get callback and visit requests and chats from tenants. Call or WhatsApp them back.",
  },
];

const FAQS = [
  {
    q: "Is it really free to list my PG?",
    a: `Yes. The ${PLANS.FREE.name} plan lets you publish ${PLANS.FREE.listingLimit} listing at no cost, with unlimited tenant chats and lead alerts. Paid plans are only needed if you want to list more properties or get priority placement.`,
  },
  {
    q: "Do you charge brokerage or commission?",
    a: "No. Tenants contact you directly and pay rent to you. PGConnect does not charge any brokerage or commission on bookings.",
  },
  {
    q: "Who can see my phone number?",
    a: "Your contact number is not shown publicly. Only signed-in users can reveal it from your listing, and tenants can also reach you through in-app chat.",
  },
  {
    q: "What do I need to get verified?",
    a: "A government ID or property document (Aadhaar, PAN, driving licence, voter ID, passport, or an electricity bill / sale deed / rent agreement). We store only the last 4 characters of the document number, and the document is visible only to our verification team.",
  },
  {
    q: "Can I pause my listing when the PG is full?",
    a: "Yes. Pause it from your dashboard and it disappears from search. Activate it again whenever beds free up.",
  },
  {
    q: "How many PGs can I list?",
    a: `${PLANS.FREE.name}: ${PLANS.FREE.listingLimit}, ${PLANS.BASIC.name}: up to ${PLANS.BASIC.listingLimit}, ${PLANS.PREMIUM.name}: up to ${PLANS.PREMIUM.listingLimit}. You can upgrade or cancel anytime from Plans & billing.`,
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function OwnersPage() {
  const plans: PlanId[] = ["FREE", "BASIC", "PREMIUM"];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container grid gap-10 py-14 md:py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-semibold text-primary">
              <Building2 className="size-3.5" /> For PG, hostel & co-living owners
            </span>
            <h1 className="mt-5 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              List your PG for free — get tenant leads directly
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Reach students and working professionals looking for a PG in your area. They call, chat or book a visit
              with you — no brokers in between.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <OwnerCta />
              <Button size="lg" variant="outline" asChild>
                <Link href="/membership">See plans</Link>
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {["No brokerage", "Free first listing", "Takes about 10 minutes"].map((t) => (
                <li key={t} className="inline-flex items-center gap-1.5">
                  <Check className="size-4 text-primary" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm" aria-hidden>
            <p className="text-sm font-semibold text-muted-foreground">What tenants see on your listing</p>
            <ul className="mt-4 space-y-3">
              {[
                { icon: BadgeCheck, text: "Verified owner badge" },
                { icon: IndianRupee, text: "Rent, deposit & food — upfront" },
                { icon: Camera, text: "Your real photos" },
                { icon: PhoneCall, text: "Request callback / Book a visit" },
                { icon: MessageSquareText, text: "Chat with owner" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5 text-sm font-medium">
                  <Icon className="size-4 text-primary" /> {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container py-14 md:py-20" aria-labelledby="benefits-heading">
        <h2 id="benefits-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
          Why owners list on PGConnect
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Everything you need to fill beds faster, without paying a broker.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-xl border bg-card p-5 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section className="border-y bg-muted/40" aria-labelledby="how-heading">
        <div className="container py-14 md:py-20">
          <h2 id="how-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative rounded-xl border bg-card p-5 shadow-sm">
                <span className="absolute right-4 top-4 text-3xl font-bold text-muted-foreground/20">{i + 1}</span>
                <Icon className="size-6 text-primary" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <OwnerCta label="Get started" />
          </div>
        </div>
      </section>

      {/* Plans teaser */}
      <section className="container py-14 md:py-20" aria-labelledby="plans-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="plans-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
              Start free, upgrade when you grow
            </h2>
            <p className="mt-2 text-muted-foreground">Simple monthly plans. Cancel anytime.</p>
          </div>
          <Button variant="link" asChild className="px-0">
            <Link href="/membership">Compare all features →</Link>
          </Button>
        </div>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((id) => {
            const plan = PLANS[id];
            return (
              <li
                key={id}
                className={cn(
                  "rounded-xl border bg-card p-5 shadow-sm",
                  plan.highlighted && "border-primary ring-1 ring-primary"
                )}
              >
                <p className="font-semibold">{plan.name}</p>
                <p className="mt-2 text-2xl font-bold">
                  {plan.priceMonthly === 0 ? "Free" : formatINR(plan.priceMonthly)}
                  {plan.priceMonthly > 0 ? <span className="text-sm font-normal text-muted-foreground">/month</span> : null}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.listingLimit === 1 ? "1 listing" : `Up to ${plan.listingLimit} listings`} · {plan.tagline}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* FAQ */}
      <section className="border-t bg-muted/40" aria-labelledby="faq-heading">
        <div className="container max-w-3xl py-14 md:py-20">
          <h2 id="faq-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Questions owners ask
          </h2>
          <div className="mt-6 divide-y rounded-xl border bg-card">
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
        </div>
      </section>

      {/* Final CTA */}
      <section className="container py-14 md:py-20">
        <div className="flex flex-col items-start gap-5 rounded-2xl bg-primary px-6 py-10 text-primary-foreground sm:px-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Ready to fill your empty beds?</h2>
            <p className="mt-1 text-primary-foreground/80">Your first listing is free. No brokerage, ever.</p>
          </div>
          <OwnerCta variant="secondary" />
        </div>
      </section>
    </>
  );
}
