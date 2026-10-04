import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Liveness + database readiness probe for load balancers and uptime monitors. */
export async function GET() {
  let db: "up" | "down" = "up";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    db = "down";
    console.error("[health] database check failed", error);
  }
  return NextResponse.json(
    { ok: db === "up", db, time: new Date().toISOString() },
    { status: db === "up" ? 200 : 503, headers: { "cache-control": "no-store" } }
  );
}
