import Link from "next/link";
import { POPULAR_CITIES, SUPPORT_EMAIL } from "@/lib/constants";
import { citySlug, titleCase } from "@/lib/format";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/40">
      <div className="container grid gap-10 py-12 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            Verified PGs and co-living spaces across India. Chat with owners directly — zero brokerage.
          </p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm font-medium text-primary hover:underline">
            {SUPPORT_EMAIL}
          </a>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">PGs by city</h3>
          <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            {POPULAR_CITIES.slice(0, 8).map((city) => (
              <li key={city}>
                <Link href={`/pg-in/${citySlug(city)}`} className="hover:text-foreground">
                  PG in {titleCase(city)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">For owners</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/owners" className="hover:text-foreground">List your PG for free</Link></li>
            <li><Link href="/membership" className="hover:text-foreground">Plans & pricing</Link></li>
            <li><Link href="/dashboard" className="hover:text-foreground">Owner dashboard</Link></li>
            <li><Link href="/dashboard/verify-owner" className="hover:text-foreground">Get verified</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Company</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/contact" className="hover:text-foreground">Contact us</Link></li>
            <li><Link href="/terms" className="hover:text-foreground">Terms of use</Link></li>
            <li><Link href="/privacy" className="hover:text-foreground">Privacy policy</Link></li>
            <li><Link href="/refund-policy" className="hover:text-foreground">Cancellation & refunds</Link></li>
            <li><Link href="/shipping-policy" className="hover:text-foreground">Service delivery</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PGConnect. All rights reserved.</p>
          <p>Never pay a token amount before visiting a PG in person.</p>
        </div>
      </div>
    </footer>
  );
}
