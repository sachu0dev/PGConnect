import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArrowRight, BedDouble, Building2, ChevronRight, IndianRupee, MapPin, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/components/search/search-box";
import { FilterSidebar, MobileFilters } from "@/components/search/filter-panel";
import { ResultsGrid } from "@/components/search/results-grid";
import { QuickFilters } from "@/components/home/quick-filters";
import { Faq, type FaqItem } from "@/components/home/faq";
import { OwnerCta } from "@/components/home/marketing";
import { searchListings } from "@/server/listings";
import { env } from "@/server/env";
import prisma from "@/lib/prisma";
import { POPULAR_CITIES } from "@/lib/constants";
import { cityFromSlug, citySlug, formatINR, pluralize, titleCase } from "@/lib/format";
import { searchSchema } from "@/lib/validation";

export const revalidate = 600;
export const dynamicParams = true;

type PageProps = { params: Promise<{ city: string }> };

export function generateStaticParams() {
  return POPULAR_CITIES.map((city) => ({ city: citySlug(city) }));
}

function parseCity(slug: string): string | null {
  const city = cityFromSlug(slug);
  return /^[a-z][a-z .]{1,59}$/.test(city) ? city : null;
}

const getCityData = cache(async (city: string) => {
  const where = { status: "ACTIVE" as const, city, owner: { isBanned: false } };
  try {
    const [agg, localities, result] = await Promise.all([
      prisma.pg.aggregate({ where, _count: { _all: true }, _min: { rentPerMonth: true }, _sum: { capacity: true } }),
      prisma.pg.groupBy({
        by: ["locality"],
        where: { ...where, locality: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { locality: "desc" } },
        take: 10,
      }),
      searchListings(searchSchema.parse({ city, limit: 12 })),
    ]);
    return {
      count: agg._count._all,
      minRent: agg._min.rentPerMonth,
      beds: agg._sum.capacity ?? 0,
      localities: localities
        .filter((l): l is typeof l & { locality: string } => Boolean(l.locality))
        .map((l) => ({ name: l.locality, count: l._count._all })),
      items: result.items,
    };
  } catch (error) {
    console.error("[city-page] data load failed", error);
    return { count: 0, minRent: null, beds: 0, localities: [], items: [] };
  }
});

function cityFaq(name: string, data: { count: number; minRent: number | null }): FaqItem[] {
  return [
    {
      q: `What is the starting rent for a PG in ${name}?`,
      a:
        data.count > 0 && data.minRent
          ? `PGs on PGConnect in ${name} start from ${formatINR(data.minRent)} per month. Rent depends on the area, sharing type (single, double or triple) and whether meals are included.`
          : `Rent in ${name} depends on the area, sharing type and whether meals are included. Listings will show exact rent and deposit as owners add them.`,
    },
    {
      q: `Are there PGs for girls and boys in ${name}?`,
      a: `Yes. Use the Boys, Girls or Co-living filter to see PGs that accept you. Co-living PGs welcome everyone and show up in both boys and girls searches.`,
    },
    {
      q: `Do PGs in ${name} include food?`,
      a: `Many do. Turn on the “With food” filter to see PGs that include meals in the rent, and check the listing for details on breakfast, lunch and dinner.`,
    },
    {
      q: `Do I have to pay brokerage for a PG in ${name}?`,
      a: `No. PGConnect connects you directly with PG owners in ${name}. Never pay a token amount before visiting the PG in person.`,
    },
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: slug } = await params;
  const city = parseCity(slug);
  if (!city) return { title: "City not found", robots: { index: false } };
  const name = titleCase(city);
  const data = await getCityData(city);
  const from = data.count > 0 && data.minRent ? ` from ${formatINR(data.minRent)}/month` : "";
  const title = `PG in ${name} — Boys, Girls & Co-living${from}`;
  const description =
    data.count > 0
      ? `${pluralize(data.count, "PG")} in ${name}${from}. Compare rent, food, sharing and amenities, read real reviews and chat with owners directly — zero brokerage.`
      : `Looking for a PG in ${name}? Find paying guest rooms and co-living spaces for boys and girls, and chat with owners directly — zero brokerage.`;
  const indexable = data.count > 0 || (POPULAR_CITIES as readonly string[]).includes(city);
  return {
    title: { absolute: `${title} | PGConnect` },
    description,
    alternates: { canonical: `/pg-in/${citySlug(city)}` },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, url: `/pg-in/${citySlug(city)}` },
  };
}

export default async function CityPage({ params }: PageProps) {
  const { city: slug } = await params;
  const city = parseCity(slug);
  if (!city) notFound();
  const name = titleCase(city);
  const data = await getCityData(city);
  const faq = cityFaq(name, data);

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: env.siteUrl },
      { "@type": "ListItem", position: 2, name: `PG in ${name}`, item: `${env.siteUrl}/pg-in/${citySlug(city)}` },
    ],
  };

  const stats = [
    data.count > 0 ? { icon: Building2, label: pluralize(data.count, "PG") + " listed" } : null,
    data.minRent ? { icon: IndianRupee, label: `Starting ${formatINR(data.minRent)}/month` } : null,
    data.beds > 0 ? { icon: BedDouble, label: `${new Intl.NumberFormat("en-IN").format(data.beds)} beds` } : null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);

  return (
    <>
      <section className="border-b bg-gradient-to-b from-secondary to-background">
        <div className="container py-8 md:py-12">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
            <ol className="flex items-center gap-1">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Home
                </Link>
              </li>
              <ChevronRight className="size-3.5" aria-hidden />
              <li aria-current="page" className="font-medium text-foreground">
                PG in {name}
              </li>
            </ol>
          </nav>
          <h1 className="text-balance text-3xl font-extrabold tracking-tight md:text-4xl">
            PG in {name} — Boys, Girls &amp; Co-living
          </h1>
          <p className="mt-3 max-w-3xl text-pretty text-muted-foreground md:text-lg">
            {data.count > 0
              ? `Browse ${pluralize(data.count, "paying guest accommodation")} in ${name}${data.minRent ? `, starting at ${formatINR(data.minRent)} a month` : ""}. Compare rent, deposit, food and amenities, check reviews from real tenants and talk to owners directly — no brokers.`
              : `We're onboarding PGs in ${name} right now. Search nearby areas, or check back soon — new listings go live every day with zero brokerage.`}
          </p>
          {stats.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-2">
              {stats.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-sm font-medium"
                >
                  <Icon className="size-4 text-primary" aria-hidden /> {label}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-6 max-w-3xl space-y-4">
            <SearchBox presetCity={city} placeholder={`Search an area or college in ${name}`} />
            <QuickFilters base={{ city }} />
          </div>
        </div>
      </section>

      <div className="container grid gap-8 py-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pb-4">
            <FilterSidebar state={{ city }} />
          </div>
        </aside>

        <section className="min-w-0 space-y-6" aria-labelledby="listings-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="listings-heading" className="text-xl font-bold">
              {data.count > 0 ? `PGs in ${name}` : `No PGs listed in ${name} yet`}
            </h2>
            <MobileFilters state={{ city }} className="lg:hidden" />
          </div>

          {data.items.length > 0 ? (
            <>
              <ResultsGrid items={data.items} />
              {data.count > data.items.length ? (
                <div className="text-center">
                  <Button asChild size="lg" variant="outline">
                    <Link href={`/pgs?city=${encodeURIComponent(city)}&page=2`}>
                      View all {data.count} PGs in {name} <ArrowRight />
                    </Link>
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center">
              <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
                <Store className="size-6" aria-hidden />
              </span>
              <h3 className="text-lg font-semibold">Owners: be the first to list here</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Tenants are searching for PGs in {name}. List your property free and start getting enquiries on chat
                and phone.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <Link href="/owners">List your PG free</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/pgs">Browse all PGs</Link>
                </Button>
              </div>
            </div>
          )}

          {data.localities.length > 0 ? (
            <div>
              <h2 className="mb-3 text-xl font-bold">Popular areas in {name}</h2>
              <ul className="flex flex-wrap gap-2">
                {data.localities.map((l) => (
                  <li key={l.name}>
                    <Link
                      href={`/pgs?city=${encodeURIComponent(city)}&q=${encodeURIComponent(l.name)}`}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm hover:border-primary hover:text-primary"
                    >
                      <MapPin className="size-3.5" aria-hidden />
                      PG in {l.name}
                      <span className="text-muted-foreground">({l.count})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>

      <section className="container pb-12" aria-labelledby="city-faq">
        <div className="mx-auto max-w-3xl">
          <h2 id="city-faq" className="mb-6 text-2xl font-bold tracking-tight">
            PGs in {name}: common questions
          </h2>
          <Faq items={faq} />
        </div>
      </section>

      <section className="container pb-16">
        <OwnerCta
          title={`Own a PG in ${name}? List it free.`}
          text={`Tenants in ${name} are looking for rooms right now. Get chats, callbacks and visit requests — no commission.`}
        />
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
