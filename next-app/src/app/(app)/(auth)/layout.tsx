import type { Metadata } from "next";
import { BadgeCheck, IndianRupee, Lock, MessageCircleMore, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

const TRUST_POINTS = [
  { icon: BadgeCheck, title: "ID-verified owners", text: "Look for the verified badge — we check owner documents before it appears." },
  { icon: IndianRupee, title: "Zero brokerage", text: "Talk to owners directly. Rent, deposit and food charges are listed upfront." },
  { icon: MessageCircleMore, title: "Chat & book visits", text: "Message owners, request a callback or schedule a visit in one tap." },
  { icon: ShieldCheck, title: "Report fake listings", text: "Real photos and genuine reviews, with listings moderated by our team." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container py-8 sm:py-12 lg:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border bg-card shadow-sm lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-black/10 blur-3xl"
          />
          <div className="relative space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/80">PGConnect</p>
            <h2 className="text-3xl font-bold leading-tight">Find a PG that feels like home.</h2>
            <p className="text-primary-foreground/85">
              Verified PGs and co-living spaces across India — compare rent, food and amenities, then talk to the owner directly.
            </p>
          </div>
          <ul className="relative space-y-5">
            {TRUST_POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-primary-foreground/80">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="relative flex items-start gap-2 rounded-xl bg-white/10 p-4 text-sm text-primary-foreground/90">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
            Your email and phone number stay private. Owners only see what you choose to share when you enquire.
          </p>
        </aside>
        <section className="flex items-center justify-center px-4 py-8 sm:px-10 sm:py-12">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
      <ul className="mx-auto mt-6 flex max-w-md flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground lg:hidden">
        <li className="flex items-center gap-1.5"><BadgeCheck className="size-4 text-primary" aria-hidden /> Verified owners</li>
        <li className="flex items-center gap-1.5"><IndianRupee className="size-4 text-primary" aria-hidden /> Zero brokerage</li>
        <li className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-primary" aria-hidden /> Moderated listings</li>
      </ul>
    </div>
  );
}
