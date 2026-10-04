import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { cache } from "react";
import { BadgeCheck, ChevronRight, ExternalLink, MapPin, PauseCircle, Sparkles, Star, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gallery } from "@/components/listing/gallery";
import { ListingViewerProvider } from "@/components/listing/viewer-provider";
import { ListingActionCard, MobileActionBar, type ActionPg } from "@/components/listing/action-panel";
import { AmenityList, KeyFacts, OwnerCard, SafetyTips } from "@/components/listing/details";
import { ReviewsSection } from "@/components/listing/reviews-section";
import { ResultsGrid } from "@/components/search/results-grid";
import { getListingDetail, getSimilarListings } from "@/server/listings";
import { getReviewPage } from "@/server/engagement";
import { env } from "@/server/env";
import prisma from "@/lib/prisma";
import { amenityLabel, genderLabel, sharingLabel } from "@/lib/constants";
import { citySlug, formatINR, pluralize, titleCase, truncate } from "@/lib/format";
import type { PgDetail } from "@/lib/types";

// Rendered per request so every view is counted and status changes show up immediately.
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

const loadListing = cache(async (id: string): Promise<PgDetail | null> => {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return null;
  const [pg, bannedOwner] = await Promise.all([
    getListingDetail(id),
    prisma.pg.count({ where: { id, owner: { isBanned: true } } }),
  ]);
  if (!pg || pg.status === "BLOCKED" || bannedOwner > 0) return null;
  return pg;
});

function placeOf(pg: PgDetail) {
  return [pg.locality, titleCase(pg.city)].filter(Boolean).join(", ");
}

function absoluteUrl(src: string) {
  return /^https?:\/\//.test(src) ? src : `${env.siteUrl}${src.startsWith("/") ? "" : "/"}${src}`;
}

function audience(gender: PgDetail["gender"]) {
  return gender === "MALE" ? "Boys PG" : gender === "FEMALE" ? "Girls PG" : "Co-living PG";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const pg = await loadListing(id);
  if (!pg) notFound();

  const place = placeOf(pg);
  const title = `${pg.name} in ${place} — from ${formatINR(pg.rentPerMonth)}/month`;
  const highlights = [
    pg.foodIncluded ? "food included" : null,
    pg.sharingTypes.length ? `${pg.sharingTypes.map(sharingLabel).join("/")} rooms` : null,
    ...pg.amenities.slice(0, 3).map((a) => amenityLabel(a)),
  ].filter(Boolean);
  const description = truncate(
    `${audience(pg.gender)} in ${place}. Rent from ${formatINR(pg.rentPerMonth)}/month${
      highlights.length ? `, ${highlights.join(", ")}` : ""
    }. ${pg.reviewCount > 0 ? `Rated ${pg.avgRating.toFixed(1)}/5 by ${pluralize(pg.reviewCount, "tenant")}. ` : ""}Chat with the owner directly — zero brokerage.`,
    160
  );
  const canonical = `/pg/${pg.id}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: pg.status === "ACTIVE" ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { type: "website", title, description, url: canonical, siteName: "PGConnect", locale: "en_IN" },
    twitter: { card: "summary_large_image", title, description },
  };
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2 id={id} className="text-xl font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function ListingPage({ params }: PageProps) {
  const { id } = await params;
  const pg = await loadListing(id);
  if (!pg) notFound();

  // Count the view after the response is sent. Raw SQL so `updatedAt` is not bumped.
  after(async () => {
    try {
      await prisma.$executeRaw`UPDATE "Pg" SET "views" = "views" + 1 WHERE "id" = ${pg.id}`;
    } catch {
      // Ignore: a missed view count must never break the page.
    }
  });

  const [reviews, similar] = await Promise.all([
    getReviewPage(pg.id, 1),
    pg.status === "ACTIVE" ? getSimilarListings(pg) : Promise.resolve([]),
  ]);

  const place = placeOf(pg);
  const hasCoords = pg.latitude !== null && pg.longitude !== null;
  const addressHasCity = pg.address.toLowerCase().includes(pg.city);
  const fullAddress = addressHasCity ? pg.address : `${pg.address}, ${titleCase(pg.city)}`;
  const mapsQuery = hasCoords ? `${pg.latitude},${pg.longitude}` : fullAddress;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
  const actionPg: ActionPg = {
    id: pg.id,
    name: pg.name,
    ownerId: pg.owner.id,
    rentPerMonth: pg.rentPerMonth,
    deposit: pg.deposit,
    bedsAvailable: pg.bedsAvailable,
    status: pg.status,
    place,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": `${env.siteUrl}/pg/${pg.id}`,
    name: pg.name,
    description: truncate(pg.description, 500),
    url: `${env.siteUrl}/pg/${pg.id}`,
    image: pg.images.slice(0, 6).map(absoluteUrl),
    priceRange: `From ${formatINR(pg.rentPerMonth)} per month`,
    address: {
      "@type": "PostalAddress",
      streetAddress: pg.address,
      addressLocality: pg.locality ?? titleCase(pg.city),
      addressRegion: titleCase(pg.city),
      addressCountry: "IN",
    },
    ...(hasCoords ? { geo: { "@type": "GeoCoordinates", latitude: pg.latitude, longitude: pg.longitude } } : {}),
    amenityFeature: pg.amenities.map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: amenityLabel(a),
      value: true,
    })),
    ...(reviews.summary.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviews.summary.avgRating,
            reviewCount: reviews.summary.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: env.siteUrl },
      { "@type": "ListItem", position: 2, name: `PG in ${titleCase(pg.city)}`, item: `${env.siteUrl}/pg-in/${citySlug(pg.city)}` },
      { "@type": "ListItem", position: 3, name: pg.name, item: `${env.siteUrl}/pg/${pg.id}` },
    ],
  };

  return (
    <ListingViewerProvider pgId={pg.id} ownerId={pg.owner.id}>
      <div className="container pb-28 pt-4 md:pt-6 lg:pb-16">
        <nav aria-label="Breadcrumb" className="mb-4 hidden text-sm text-muted-foreground sm:block">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
            </li>
            <ChevronRight className="size-3.5" aria-hidden />
            <li>
              <Link href={`/pg-in/${citySlug(pg.city)}`} className="hover:text-foreground">
                PG in {titleCase(pg.city)}
              </Link>
            </li>
            <ChevronRight className="size-3.5" aria-hidden />
            <li aria-current="page" className="max-w-[16rem] truncate font-medium text-foreground">
              {pg.name}
            </li>
          </ol>
        </nav>

        {pg.status !== "ACTIVE" ? (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm" role="status">
            <PauseCircle className="size-4 shrink-0 text-warning" aria-hidden />
            <span>
              <span className="font-semibold">Not accepting enquiries right now.</span> This PG may be full — explore
              similar PGs nearby.
            </span>
          </div>
        ) : null}

        <Gallery images={pg.images} name={pg.name} />

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-10">
            <header className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{audience(pg.gender)}</Badge>
                {pg.owner.isVerified ? (
                  <Badge variant="success">
                    <BadgeCheck /> Verified owner
                  </Badge>
                ) : null}
                {pg.isFeatured ? (
                  <Badge className="border-transparent bg-amber-400 text-amber-950">
                    <Sparkles /> Featured
                  </Badge>
                ) : null}
                {pg.foodIncluded ? (
                  <Badge variant="outline">
                    <UtensilsCrossed /> Food included
                  </Badge>
                ) : null}
              </div>
              <h1 className="text-balance text-2xl font-extrabold tracking-tight md:text-3xl">{pg.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground hover:underline"
                >
                  <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
                  {place}
                  <ExternalLink className="size-3" aria-hidden />
                  <span className="sr-only">(opens Google Maps)</span>
                </a>
                {pg.reviewCount > 0 ? (
                  <a href="#reviews-heading" className="inline-flex items-center gap-1 hover:text-foreground">
                    <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                    <span className="font-semibold text-foreground">{pg.avgRating.toFixed(1)}</span>(
                    {pluralize(pg.reviewCount, "review")})
                  </a>
                ) : null}
                <span>{genderLabel(pg.gender) === "Co-living" ? "Open to all" : `For ${genderLabel(pg.gender).toLowerCase()}`}</span>
              </div>
            </header>

            <div className="lg:hidden">
              <ListingActionCard pg={actionPg} />
            </div>

            <Section id="facts-heading" title="Key details">
              <KeyFacts pg={pg} />
            </Section>

            <Section id="about-heading" title="About this PG">
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">{pg.description}</p>
            </Section>

            <Section id="amenities-heading" title="Amenities">
              <AmenityList amenities={pg.amenities} />
            </Section>

            {pg.houseRules ? (
              <Section id="rules-heading" title="House rules">
                <p className="whitespace-pre-line rounded-xl border bg-muted/40 p-5 text-sm leading-relaxed">
                  {pg.houseRules}
                </p>
              </Section>
            ) : null}

            <Section id="location-heading" title="Location">
              <p className="flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>{fullAddress}</span>
              </p>
              {hasCoords ? (
                <div className="overflow-hidden rounded-xl border">
                  <iframe
                    title={`Map showing the location of ${pg.name}`}
                    src={`https://www.google.com/maps?q=${pg.latitude},${pg.longitude}&z=15&output=embed`}
                    className="h-72 w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : null}
              <Button asChild variant="outline">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin /> Open in Google Maps
                </a>
              </Button>
            </Section>

            <ReviewsSection pgId={pg.id} pgName={pg.name} data={reviews} />

            <Section id="owner-heading" title="Listed by">
              <OwnerCard owner={pg.owner} />
            </Section>

            <SafetyTips />
          </div>

          <aside className="hidden lg:block" aria-label="Contact the owner">
            <div className="sticky top-20">
              <ListingActionCard pg={actionPg} />
            </div>
          </aside>
        </div>

        {similar.length > 0 ? (
          <section aria-labelledby="similar-heading" className="mt-16">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 id="similar-heading" className="text-xl font-bold md:text-2xl">
                Similar PGs in {titleCase(pg.city)}
              </h2>
              <Link href={`/pg-in/${citySlug(pg.city)}`} className="text-sm font-medium text-primary hover:underline">
                See all
              </Link>
            </div>
            <ResultsGrid items={similar} className="lg:grid-cols-4 xl:grid-cols-4" />
          </section>
        ) : null}
      </div>

      <MobileActionBar pg={actionPg} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbs]).replace(/</g, "\\u003c") }}
      />
    </ListingViewerProvider>
  );
}
