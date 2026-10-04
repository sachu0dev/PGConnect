import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new ApiError(400, message, details);
export const unauthorized = (message = "Please log in to continue") =>
  new ApiError(401, message);
export const forbidden = (message = "You do not have access to this resource") =>
  new ApiError(403, message);
export const notFound = (message = "Not found") => new ApiError(404, message);
export const conflict = (message: string) => new ApiError(409, message);
export const tooManyRequests = (message = "Too many requests. Please try again later.") =>
  new ApiError(429, message);

export function ok<T>(data: T, init?: number | ResponseInit) {
  const responseInit = typeof init === "number" ? { status: init } : init;
  return NextResponse.json({ success: true, data }, responseInit);
}

export function fail(status: number, error: string, details?: unknown) {
  return NextResponse.json(
    { success: false, error, ...(details ? { details } : {}) },
    { status }
  );
}

type RouteContext<P> = { params: Promise<P> };
type Handler<P> = (req: NextRequest, ctx: RouteContext<P>) => Promise<Response>;

/**
 * Wraps a route handler with uniform error handling so handlers can simply
 * throw ApiError / ZodError and never leak internals to clients.
 */
export function route<P = Record<string, string>>(handler: Handler<P>): Handler<P> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof ApiError) {
        return fail(error.status, error.message, error.details);
      }
      if (error instanceof ZodError) {
        const first = error.errors[0];
        return fail(
          400,
          first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input",
          error.flatten().fieldErrors
        );
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") return fail(409, "This record already exists");
        if (error.code === "P2025") return fail(404, "Not found");
      }
      if (error instanceof SyntaxError) {
        return fail(400, "Malformed request body");
      }
      console.error(`[api] ${req.method} ${req.nextUrl.pathname}`, error);
      return fail(500, "Something went wrong. Please try again.");
    }
  };
}

export async function readJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text) return {};
  return JSON.parse(text);
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
