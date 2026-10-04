import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CheckCircle2, LayoutDashboard, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Payment successful",
  robots: { index: false, follow: false },
};

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const info = plan === "BASIC" || plan === "PREMIUM" ? PLANS[plan] : null;

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-lg rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-10">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-9" />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">Payment successful</h1>
        <p className="mt-2 text-muted-foreground">
          {info
            ? `Your ${info.name} plan is active. You can now keep up to ${info.listingLimit} listings live.`
            : "Your plan is active. Thank you for upgrading!"}{" "}
          Razorpay will email you a payment confirmation.
        </p>

        <div className="mt-6 rounded-xl bg-muted/60 p-4 text-left text-sm">
          <p className="font-semibold">What next?</p>
          <ul className="mt-2 space-y-2 text-muted-foreground">
            <li className="flex gap-2">
              <PlusCircle className="mt-0.5 size-4 shrink-0 text-primary" /> Add your other PGs or re-activate paused
              listings.
            </li>
            <li className="flex gap-2">
              <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" /> Get the Verified owner badge if you
              haven&apos;t already.
            </li>
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/dashboard">
              <LayoutDashboard /> Go to dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/post-pg">
              <PlusCircle /> Add a listing
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
