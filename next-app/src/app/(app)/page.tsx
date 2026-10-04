import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/search/search-box";
import { ResultsGrid } from "@/components/search/results-grid";
import { QuickFilters } from "@/components/home/quick-filters";
import { StatsStrip } from "@/components/home/stats-strip";
import { CityGrid, mergeCities } from "@/components/home/city-grid";
import { HowItWorks, OwnerCta, TrustSection } from "@/components/home/marketing";
import { Faq, type FaqItem } from "@/components/home/faq";
import { getCityCounts, getPlatformStats, searchListings, type SearchResult } from "@/server/listings";
import { searchSchema } from "@/lib/validation";

export const revalidate = 300;

const FAQ: FaqItem[] = [
  {
    q: "Is PGConnect free for tenants?",
    a: "Yes. Searching, chatting with owners, requesting callbacks and scheduling visits are completely free. There is zero brokerage — you pay rent and deposit directly to the PG owner.",
  },
  {
    q: "How do I know a PG listing is genuine?",
    a: "Look for the “Verified owner” badge — those owners have had a government ID checked by our team. Read reviews from people who actually contacted the PG, and report any listing that looks fake so our moderators can act on it.",
  },
  {
    q: "Should I pay a token amount before visiting?",
    a: "No. Never pay any advance, token or booking amount before you have visited the PG, seen the room and read the agreement. PGConnect will never ask you to pay an owner on our behalf.",
  },
  {
    q: "What does the monthly rent usually include?",
    a: "It varies by PG. Each listing shows whether food is included, the sharing types, deposit and amenities like Wi-Fi, housekeeping, laundry and power backup. Confirm electricity charges and notice period with the owner before moving in.",
  },
  {
    q: "Can I visit a PG before deciding?",
    a: "Yes. Open any listing and tap “Schedule a visit” to pick a date, or “Request callback” to have the owner call you. You can also chat with the owner directly.",
  },
  {
    q: "I own a PG. How do I list it?",
    a: "Create a free owner account, add photos, rent, sharing types and amenities, and your PG goes live right away. You get tenant enquiries on chat, by callback and as visit requests.",
  },
];

async function safely<T>(task: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await task();
  } catch (error) {
    console.error("[home] data load failed", error);
    return fallback;
  }
}

const EMPTY_RESULT: SearchResult = { items: [], pagination: { page: 1, limit: 8, total: 0, totalPages: 1 } };

export default async function HomePage() {
  const [stats, cityCounts, featured] = await Promise.all([
    safely(getPlatformStats, { listings: 0, cities: 0, beds: 0 }),
    safely(() => getCityCounts(24), []),
    safely(() => searchListings(searchSchema.parse({ sort: "recommended", limit: 8 })), EMPTY_RESULT),
  ]);
  const cities = mergeCities(cityCounts, 12);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-secondary via-secondary/40 to-background">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(hsl(var(--primary)/0.25)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
          aria-hidden
        />
        <div className="container relative py-14 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
              <ShieldCheck className="size-3.5" aria-hidden /> Zero brokerage · Direct owners
            </p>
            <h1 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Find a PG you&apos;ll love living in, <span className="text-primary">near your college or office</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
              Compare rent, food, sharing and amenities across verified PGs and co-living spaces. Chat with owners
              directly and book a visit — free.
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-3xl space-y-5">
            <SearchBox size="lg" />
            <QuickFilters className="justify-center" />
            <StatsStrip stats={stats} className="justify-center pt-2" />
          </div>
        </div>
      </section>

      {/* Popular cities */}
      <section className="container py-14 md:py-20" aria-labelledby="cities-heading">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 id="cities-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
              Popular cities
            </h2>
            <p className="mt-1 text-muted-foreground">PGs for students and working professionals across India.</p>
          </div>
        </div>
        <CityGrid cities={cities} />
      </section>

      {/* Featured / recently added */}
      {featured.items.length > 0 ? (
        <section className="border-y bg-muted/30" aria-labelledby="featured-heading">
          <div className="container py-14 md:py-20">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 id="featured-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
                  Featured & recently added
                </h2>
                <p className="mt-1 text-muted-foreground">Fresh listings from owners on PGConnect.</p>
              </div>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/pgs">
                  View all <ArrowRight />
                </Link>
              </Button>
            </div>
            <ResultsGrid items={featured.items} className="lg:grid-cols-3 xl:grid-cols-4" />
            <div className="mt-6 text-center sm:hidden">
              <Button asChild variant="outline">
                <Link href="/pgs">
                  View all PGs <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      {/* Trust */}
      <section className="container py-14 md:py-20" aria-labelledby="trust-heading">
        <div className="mb-8 max-w-2xl">
          <h2 id="trust-heading" className="text-2xl font-bold tracking-tight md:text-3xl">
            Why tenants choose PGConnect
          </h2>
          <p className="mt-1 text-muted-foreground">
            Built to keep your search honest — and your money safe.
          </p>
        </div>
        <TrustSection />
      </section>

      {/* How it works */}
      <section className="border-y bg-muted/30" aria-labelledby="how-heading">
        <div className="container py-14 md:py-20">
          <h2 id="how-heading" className="mb-8 text-2xl font-bold tracking-tight md:text-3xl">
            How it works
          </h2>
          <HowItWorks />
        </div>
      </section>

      {/* Owner CTA */}
      <section className="container py-14 md:py-20" aria-label="For PG owners">
        <OwnerCta />
      </section>

      {/* FAQ */}
      <section className="container pb-16 md:pb-24" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-3xl">
          <h2 id="faq-heading" className="mb-6 text-2xl font-bold tracking-tight md:text-3xl">
            Frequently asked questions
          </h2>
          <Faq items={FAQ} />
        </div>
      </section>
    </>
  );
}
