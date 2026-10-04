"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, IndianRupee, MessageSquareText, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBecomeOwner } from "@/components/owner/use-become-owner";

const BENEFITS = [
  { icon: IndianRupee, title: "Free to start", text: "List your first PG on the Starter plan at zero cost. No brokerage, ever." },
  { icon: PhoneCall, title: "Direct tenant leads", text: "Tenants request callbacks and visits straight to you — no middlemen." },
  { icon: MessageSquareText, title: "Chat in one place", text: "Answer questions about rent, food and rooms from your inbox." },
  { icon: BadgeCheck, title: "Build trust", text: "Get ID-verified to earn the Verified owner badge on your listings." },
];

export function OwnerOnboarding() {
  const { becomeOwner, pending } = useBecomeOwner();

  return (
    <section className="mx-auto max-w-3xl animate-fade-in">
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 py-8 sm:px-10 sm:py-10">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="size-6" />
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">Start listing your PG</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Own or manage a PG, hostel or co-living space? Put it in front of students and working
            professionals searching in your area — it takes about 10 minutes.
          </p>
        </div>
        <ul className="grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-10">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                <Icon className="size-4" />
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3 border-t px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <p className="text-sm text-muted-foreground">
            Keep a few clear photos and your rent details handy.{" "}
            <Link href="/owners" className="font-medium text-primary underline-offset-4 hover:underline">
              How it works
            </Link>
          </p>
          <Button size="lg" onClick={becomeOwner} loading={pending}>
            Start listing <ArrowRight />
          </Button>
        </div>
      </div>
    </section>
  );
}
