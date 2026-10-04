import Link from "next/link";
import {
  BadgeCheck,
  Flag,
  HandCoins,
  MessageSquareText,
  Search,
  Star,
  CalendarCheck,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TRUST = [
  {
    icon: BadgeCheck,
    title: "Verified owners",
    text: "Owners with the green badge have had their government ID checked by our team.",
  },
  {
    icon: HandCoins,
    title: "Zero brokerage",
    text: "You deal with the owner directly. No broker, no hidden commission, ever.",
  },
  {
    icon: MessageSquareText,
    title: "Chat directly",
    text: "Ask about food, timings or rules in chat, or request a callback in one tap.",
  },
  {
    icon: Star,
    title: "Real reviews",
    text: "Only people who actually contacted a PG can review it — no paid ratings.",
  },
  {
    icon: Flag,
    title: "Report fake listings",
    text: "Spotted something off? Report it and our moderators act on it quickly.",
  },
];

export function TrustSection() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {TRUST.map(({ icon: Icon, title, text }) => (
        <li key={title} className="rounded-xl border bg-card p-5">
          <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden />
          </span>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{text}</p>
        </li>
      ))}
    </ul>
  );
}

const STEPS = [
  { icon: Search, title: "Search & compare", text: "Filter by budget, food, sharing and amenities near your college or office." },
  { icon: CalendarCheck, title: "Chat or book a visit", text: "Message the owner, request a callback or pick a date to see the place." },
  { icon: KeyRound, title: "Move in", text: "Visit, check the room and agreement, then pay the owner directly." },
];

export function HowItWorks() {
  return (
    <ol className="grid gap-6 md:grid-cols-3">
      {STEPS.map(({ icon: Icon, title, text }, i) => (
        <li key={title} className="relative rounded-xl border bg-card p-6">
          <span className="absolute right-5 top-4 text-4xl font-black text-muted/80" aria-hidden>
            {i + 1}
          </span>
          <span className="mb-4 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Icon className="size-5" aria-hidden />
          </span>
          <h3 className="text-lg font-semibold">
            <span className="sr-only">Step {i + 1}: </span>
            {title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{text}</p>
        </li>
      ))}
    </ol>
  );
}

export function OwnerCta({
  title = "Own a PG or hostel? List it for free.",
  text = "Reach students and working professionals looking for a room right now. Get enquiries on chat, callbacks and visit requests — no commission.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-10 text-primary-foreground md:px-12">
      <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10" aria-hidden />
      <div className="absolute -bottom-20 right-24 size-48 rounded-full bg-white/5" aria-hidden />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
          <p className="mt-2 text-primary-foreground/85">{text}</p>
        </div>
        <Button asChild size="lg" variant="secondary" className="shrink-0">
          <Link href="/owners">
            List your PG free <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
