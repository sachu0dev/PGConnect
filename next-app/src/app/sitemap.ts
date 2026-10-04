import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { POPULAR_CITIES } from "@/lib/constants";
import { citySlug } from "@/lib/format";

export const revalidate = 3600;

const STATIC_PAGES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/pgs", priority: 0.9, changeFrequency: "daily" },
  { path: "/owners", priority: 0.7, changeFrequency: "monthly" },
  { path: "/membership", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/refund-policy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/shipping-policy", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://pgconnect.site").replace(/\/$/, "");
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
    url: `${siteUrl}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  try {
    const visible = { status: "ACTIVE" as const, owner: { isBanned: false } };
    const [cities, listings] = await Promise.all([
      prisma.pg.groupBy({ by: ["city"], where: visible, _max: { updatedAt: true } }),
      prisma.pg.findMany({
        where: visible,
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 45000,
      }),
    ]);

    const cityEntries = new Map<string, Date>();
    for (const c of cities) cityEntries.set(c.city, c._max.updatedAt ?? now);
    // Popular cities have landing pages even before the first listing.
    for (const c of POPULAR_CITIES) if (!cityEntries.has(c)) cityEntries.set(c, now);

    for (const [city, lastModified] of cityEntries) {
      const slug = citySlug(city);
      if (!slug) continue;
      entries.push({ url: `${siteUrl}/pg-in/${slug}`, lastModified, changeFrequency: "daily", priority: 0.8 });
    }
    for (const pg of listings) {
      entries.push({ url: `${siteUrl}/pg/${pg.id}`, lastModified: pg.updatedAt, changeFrequency: "weekly", priority: 0.7 });
    }
  } catch (error) {
    console.error("[sitemap] failed to load dynamic entries", error);
  }

  return entries;
}
