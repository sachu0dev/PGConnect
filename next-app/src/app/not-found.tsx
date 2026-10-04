import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Home, Search } from "lucide-react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Button } from "@/components/ui/button";
import { POPULAR_CITIES } from "@/lib/constants";
import { citySlug, titleCase } from "@/lib/format";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex flex-1 items-center">
        <div className="container max-w-2xl py-16 text-center sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Error 404</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">This room seems to be taken</h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            The page you&rsquo;re looking for doesn&rsquo;t exist, or the listing has been removed by its owner.
            Let&rsquo;s find you another PG.
          </p>

          <form action="/pgs" method="get" role="search" className="mx-auto mt-8 flex max-w-md gap-2">
            <label htmlFor="nf-search" className="sr-only">
              Search by city, locality or college
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                id="nf-search"
                name="q"
                type="search"
                maxLength={100}
                placeholder="City, locality or college"
                className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              />
            </div>
            <Button type="submit" className="h-11">
              Search
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {POPULAR_CITIES.slice(0, 6).map((city) => (
              <Link
                key={city}
                href={`/pg-in/${citySlug(city)}`}
                className="rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                PG in {titleCase(city)}
              </Link>
            ))}
          </div>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="outline" asChild>
              <Link href="/">
                <Home /> Go to home
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/owners">
                <Building2 /> List your PG
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
