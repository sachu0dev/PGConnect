import { ImageResponse } from "next/og";
import prisma from "@/lib/prisma";
import { genderLabel } from "@/lib/constants";
import { titleCase, truncate } from "@/lib/format";

export const alt = "PG listing on PGConnect";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BRAND = "#0f8a78";
// The bundled OG font has no ₹ glyph, so prices use "Rs".
const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** Inlines the cover photo when it is a reachable JPEG/PNG; otherwise the card is text-only. */
async function loadCover(src: string | undefined): Promise<string | null> {
  if (!src) return null;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = /^https?:\/\//.test(src) ? src : `${base}${src.startsWith("/") ? "" : "/"}${src}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/^image\/(jpeg|png)/.test(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 4 * 1024 * 1024) return null;
    return `data:${type.split(";")[0]};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function Brand({ light }: { light?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: light ? "#ffffff" : BRAND,
          color: light ? BRAND : "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          fontWeight: 800,
        }}
      >
        P
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: light ? "#ffffff" : "#0f172a" }}>PGConnect</div>
    </div>
  );
}

export default async function OpenGraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pg = /^[A-Za-z0-9_-]{1,64}$/.test(id)
    ? await prisma.pg
        .findUnique({
          where: { id },
          select: {
            name: true,
            city: true,
            locality: true,
            rentPerMonth: true,
            gender: true,
            foodIncluded: true,
            images: true,
            status: true,
            avgRating: true,
            reviewCount: true,
            owner: { select: { isBanned: true, verification: { select: { status: true } } } },
          },
        })
        .catch(() => null)
    : null;

  if (!pg || pg.status === "BLOCKED" || pg.owner.isBanned) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: 80,
            background: `linear-gradient(135deg, ${BRAND}, #0b5e52)`,
            color: "#ffffff",
          }}
        >
          <Brand light />
          <div style={{ fontSize: 64, fontWeight: 800, marginTop: 40 }}>Find verified PGs near you</div>
          <div style={{ fontSize: 32, marginTop: 16, opacity: 0.9 }}>Zero brokerage · Chat with owners directly</div>
        </div>
      ),
      size
    );
  }

  const cover = await loadCover(pg.images[0]);
  const place = [pg.locality, titleCase(pg.city)].filter(Boolean).join(", ");
  const chips = [
    pg.gender === "ANY" ? "Co-living" : `${genderLabel(pg.gender)} PG`,
    pg.foodIncluded ? "Food included" : null,
    pg.owner.verification?.status === "APPROVED" ? "Verified owner" : null,
    pg.reviewCount > 0 ? `${pg.avgRating.toFixed(1)}/5 rating` : null,
  ].filter((c): c is string => Boolean(c));

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#ffffff" }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" width={500} height={630} style={{ width: 500, height: 630, objectFit: "cover" }} />
        ) : null}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 60px",
            background: cover ? "#ffffff" : "linear-gradient(135deg, #effcf8, #ffffff)",
          }}
        >
          <Brand />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: cover ? 54 : 64, fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
              {truncate(pg.name, 48)}
            </div>
            <div style={{ fontSize: 30, color: "#475569", marginTop: 16 }}>{truncate(place, 48)}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
              {chips.map((chip) => (
                <div
                  key={chip}
                  style={{
                    display: "flex",
                    fontSize: 22,
                    fontWeight: 600,
                    color: BRAND,
                    background: "#d7f6ee",
                    borderRadius: 999,
                    padding: "8px 18px",
                  }}
                >
                  {chip}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 22, color: "#64748b" }}>Rent from</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <div style={{ fontSize: 60, fontWeight: 800, color: BRAND }}>{`Rs ${inr.format(pg.rentPerMonth)}`}</div>
                <div style={{ fontSize: 26, color: "#64748b" }}>/month</div>
              </div>
            </div>
            <div style={{ fontSize: 22, color: "#64748b" }}>Zero brokerage</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
