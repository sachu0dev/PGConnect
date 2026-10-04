import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ChevronRight, Clock, CreditCard, Flag, Mail, ShieldCheck } from "lucide-react";
import { ContactForm } from "@/components/legal/contact-form";
import { LEGAL_LAST_UPDATED } from "@/components/legal/legal-page";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Get help from the PGConnect team — finding a PG, managing your listing, plans and billing, or reporting a fake listing.",
  alternates: { canonical: "/contact" },
};

const SHORTCUTS = [
  {
    icon: Flag,
    title: "Report a fake listing",
    text: "Use the Report button on the listing page — it reaches our moderators fastest.",
    href: "/pgs",
    cta: "Browse PGs",
  },
  {
    icon: Building2,
    title: "Owners",
    text: "Add, edit or pause listings and see your leads in the owner dashboard.",
    href: "/dashboard",
    cta: "Open dashboard",
  },
  {
    icon: CreditCard,
    title: "Plans & billing",
    text: "Upgrade or cancel your plan anytime. Read how refunds work.",
    href: "/refund-policy",
    cta: "Refund policy",
  },
  {
    icon: ShieldCheck,
    title: "Privacy requests",
    text: "Delete your account from Account settings, or email us to access or correct your data.",
    href: "/privacy#rights",
    cta: "Your rights",
  },
] as const;

export default function ContactPage() {
  return (
    <div className="container max-w-5xl py-8 sm:py-12">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span aria-current="page" className="text-foreground">
          Contact us
        </span>
      </nav>
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">We&rsquo;re here to help</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          Questions about a PG, your listing or your plan? Write to us and a real person from the {APP_NAME} team
          will get back to you.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="contact-form-title" className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
          <h2 id="contact-form-title" className="text-lg font-semibold">
            Send us a message
          </h2>
          <p className="mb-5 mt-1 text-sm text-muted-foreground">
            Include the PG name or link and your registered email so we can help faster.
          </p>
          <ContactForm />
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Email</p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="block truncate font-semibold text-primary hover:underline"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clock className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Response time</p>
                <p className="font-semibold">Within 1 business day</p>
                <p className="text-xs text-muted-foreground">Mon–Sat, 10 am – 7 pm IST</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-5 text-sm">
            <h2 className="font-semibold">Business details</h2>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="text-muted-foreground">Legal entity</dt>
                <dd>[Merchant legal entity name]</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Registered address</dt>
                <dd>[Registered address]</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Grievance Officer</dt>
                <dd>
                  <a href={`mailto:${SUPPORT_EMAIL}?subject=Grievance`} className="text-primary hover:underline">
                    {SUPPORT_EMAIL}
                  </a>
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">Last updated: {LEGAL_LAST_UPDATED}</p>
          </div>
        </aside>
      </div>

      <section aria-labelledby="shortcuts-title" className="mt-10">
        <h2 id="shortcuts-title" className="text-lg font-semibold">
          Quicker ways to get things done
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SHORTCUTS.map(({ icon: Icon, title, text, href, cta }) => (
            <li key={title} className="flex flex-col rounded-xl border bg-card p-5 shadow-sm">
              <Icon className="size-5 text-primary" aria-hidden />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{text}</p>
              <Link href={href} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                {cta} <ChevronRight className="size-3.5" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-10 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
        <strong>Safety tip:</strong> {APP_NAME} never asks for OTPs, passwords or advance payments over phone or
        WhatsApp. Never pay a token amount before visiting a PG in person.
      </p>
    </div>
  );
}
