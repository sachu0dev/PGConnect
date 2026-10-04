"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Building2, Flag, LayoutGrid, ShieldCheck, Users } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { UserMenu } from "@/components/site/user-menu";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/listings", label: "Listings", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const { ready } = useRequireAuth({ admin: true });
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col bg-muted/20">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="container flex h-14 items-center gap-3">
          <Logo />
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
            Admin
          </span>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/">
                <ArrowLeft /> Back to site
              </Link>
            </Button>
            <Button variant="ghost" size="icon" asChild className="sm:hidden">
              <Link href="/" aria-label="Back to site">
                <ArrowLeft />
              </Link>
            </Button>
            <ThemeToggle />
            {ready ? <UserMenu /> : null}
          </div>
        </div>
        <nav aria-label="Admin" className="container -mb-px flex gap-1 overflow-x-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main id="main" className="container flex-1 py-6 md:py-8">
        {ready ? children : <PageSpinner />}
      </main>
    </div>
  );
}
