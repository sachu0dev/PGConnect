import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/account", "/chat", "/admin"];

/**
 * Optimistic redirect for signed-out visitors. Real authorization happens in
 * every API route; this only avoids flashing protected UI to guests.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !req.cookies.has("refreshToken")) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/account/:path*", "/chat/:path*", "/admin/:path*"],
};
