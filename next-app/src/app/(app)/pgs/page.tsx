import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ActiveFilters } from "@/components/search/active-filters";
import { FilterSidebar, MobileFilters } from "@/components/search/filter-panel";
import { ResultsGrid } from "@/components/search/results-grid";
import { ResultsView } from "@/components/search/results-view";
import { SearchBox } from "@/components/search/search-box";
import { PendingArea, SearchNavigationProvider } from "@/components/search/search-navigation";
import { SearchPagination } from "@/components/search/search-pagination";
import { SortSelect } from "@/components/search/sort-select";
import {
  buildHref,
  clearFilters,
  countFilters,
  parseSearchParams,
  placeLabel,
  toFilterState,
  toQueryString,
  type FilterState,
} from "@/components/search/search-url";
import { searchListings } from "@/server/listings";
import { env } from "@/server/env";
import { POPULAR_CITIES } from "@/lib/constants";
import { citySlug, pluralize, titleCase } from "@/lib/format";
import type { SearchParams } from "@/lib/validation";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const runSearch = cache((key: string) => searchListings(JSON.parse(key) as SearchParams));

function subjectFor(state: FilterState) {
  if (state.gender === "MALE") return "PGs for boys";
  if (state.gender === "FEMALE") return "PGs for girls";
  if (state.gender === "ANY") return "Co-living PGs";
  return "PGs";
}

function headingFor(state: FilterState) {
  const subject = subjectFor(state);
  const place = placeLabel(state);
  if (state.lat !== undefined) return place === "you" ? `${subject} near you` : `${subject} near ${place}`;
  return place ? `${subject} in ${place}` : `${subject} across India`;
}

/** Indexable only for plain place / gender searches; everything else is noindex. */
function isIndexable(state: FilterState) {
  return (
    state.lat === undefined &&
    !state.sort &&
    countFilters(state) - (state.gender ? 1 : 0) === 0
  );
}

function canonicalFor(state: FilterState) {
  const indexable: FilterState = { q: state.q, city: state.city, gender: state.gender, page: state.page };
  if (state.city && !state.q && !state.gender && !state.page) return `/pg-in/${citySlug(state.city)}`;
  const qs = toQueryString(indexable);
  return qs ? `/pgs?${qs}` : "/pgs";
}

async function load(searchParams: PageProps["searchParams"]) {
  const { params, near } = parseSearchParams(await searchParams);
  const state = toFilterState(params, near);
  const result = await runSearch(JSON.stringify(params));
  return { params, state, result };
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { state, result } = await load(searchParams);
  const heading = headingFor(state);
  const total = result.pagination.total;
  const pageSuffix = state.page ? ` — Page ${state.page}` : "";
  const description =
    total > 0
      ? `${pluralize(total, "verified listing")} for ${heading.toLowerCase()}. Compare rent, food, sharing and amenities, read reviews and chat with owners directly — zero brokerage on PGConnect.`
      : `Search ${heading.toLowerCase()} on PGConnect. Compare rent, food and amenities and chat with owners directly — zero brokerage.`;
  return {
    title: `${heading}${pageSuffix}`,
    description,
    alternates: { canonical: canonicalFor(state) },
    robots: isIndexable(state) && total > 0 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: `${heading} | PGConnect`, description, url: canonicalFor(state) },
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { params, state, result } = await load(searchParams);
  const { items, pagination } = result;
  const filters = countFilters(state);
  const keep: FilterState = { ...state, q: undefined, city: undefined, near: undefined };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((pg, i) => ({
      "@type": "ListItem",
      position: (pagination.page - 1) * pagination.limit + i + 1,
      url: `${env.siteUrl}/pg/${pg.id}`,
      name: pg.name,
    })),
  };

  return (
    <SearchNavigationProvider>
      <div className="border-b bg-gradient-to-b from-secondary/60 to-background">
        <div className="container space-y-4 py-6 md:py-8">
          <SearchBox
            key={`${state.q ?? ""}|${state.near ?? ""}`}
            defaultValue={state.near ?? state.q ?? (state.city ? titleCase(state.city) : "")}
            keep={keep}
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{headingFor(state)}</h1>
            <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
              {pagination.total > 0
                ? `${pluralize(pagination.total, "PG")} found${params.lat !== undefined ? ` within ${params.radiusKm} km` : ""}`
                : "No exact matches yet"}
            </p>
          </div>
        </div>
      </div>

      <div className="container grid gap-8 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-8">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pb-4">
            <FilterSidebar state={state} />
          </div>
        </aside>

        <section className="min-w-0 space-y-5" aria-label="Search results">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MobileFilters state={state} className="lg:hidden" />
            <div className="ml-auto">
              <SortSelect state={state} />
            </div>
          </div>
          <ActiveFilters state={state} />

          <PendingArea className="space-y-6">
            {items.length > 0 ? (
              <>
                <ResultsView items={items}>
                  <ResultsGrid items={items} />
                </ResultsView>
                <SearchPagination state={state} page={pagination.page} totalPages={pagination.totalPages} />
              </>
            ) : (
              <EmptyState
                icon={SearchX}
                title={pagination.page > 1 && pagination.total > 0 ? "No more results" : "No PGs match your search"}
                description={
                  filters > 0
                    ? "Try removing a few filters or widening your budget — new PGs are listed every day."
                    : "We don't have listings here yet. Try a nearby area or one of the popular cities below."
                }
                action={
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex flex-wrap justify-center gap-2">
                      {filters > 0 ? (
                        <Button asChild>
                          <Link href={buildHref("/pgs", clearFilters(state))}>Clear all filters</Link>
                        </Button>
                      ) : null}
                      <Button asChild variant="outline">
                        <Link href="/pgs">Browse all PGs</Link>
                      </Button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {POPULAR_CITIES.slice(0, 6).map((city) => (
                        <Link
                          key={city}
                          href={`/pg-in/${citySlug(city)}`}
                          className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          {titleCase(city)}
                        </Link>
                      ))}
                    </div>
                  </div>
                }
              />
            )}
          </PendingArea>
        </section>
      </div>

      {items.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replace(/</g, "\\u003c") }}
        />
      ) : null}
    </SearchNavigationProvider>
  );
}
