"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, MessageSquareText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const NAV = [
  { href: "/pgs", label: "Find a PG" },
  { href: "/owners", label: "List your PG" },
  { href: "/membership", label: "Pricing" },
];

export function SiteHeader() {
  const { user, status } = useAuth();
  const unread = useUnreadCount();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center gap-4">
        <Logo />
        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                pathname.startsWith(item.href) && "text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
          {user?.isOwner ? (
            <Link
              href="/dashboard"
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                pathname.startsWith("/dashboard") && "text-foreground"
              )}
            >
              Dashboard
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          {status === "authenticated" ? (
            <>
              <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
                <Link href="/account/saved" aria-label="Saved PGs">
                  <Heart />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild className="relative">
                <Link href="/chat" aria-label={`Messages${unread ? ` (${unread} unread)` : ""}`}>
                  <MessageSquareText />
                  {unread > 0 ? (
                    <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-destructive-foreground">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  ) : null}
                </Link>
              </Button>
              <div className="ml-1">
                <UserMenu />
              </div>
            </>
          ) : status === "guest" ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" asChild>
                <Link href={`/login?next=${encodeURIComponent(pathname)}`}>Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          ) : (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" aria-hidden />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t bg-background md:hidden">
          <nav className="container flex flex-col gap-1 py-3" aria-label="Mobile">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-3 py-2.5 font-medium hover:bg-accent">
                {item.label}
              </Link>
            ))}
            {user?.isOwner ? (
              <Link href="/dashboard" className="rounded-md px-3 py-2.5 font-medium hover:bg-accent">
                Owner dashboard
              </Link>
            ) : null}
            {status === "guest" ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button variant="outline" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Sign up</Link>
                </Button>
              </div>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
