"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, PhoneCall, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Profile & security", short: "Profile", icon: UserRound },
  { href: "/account/saved", label: "Saved PGs", short: "Saved", icon: Heart },
  { href: "/account/enquiries", label: "My enquiries", short: "Enquiries", icon: PhoneCall },
] as const;

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-1 rounded-xl bg-muted p-1 sm:w-auto">
        {LINKS.map(({ href, label, short, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active && "bg-background text-foreground shadow-sm"
                )}
              >
                <Icon className="size-4" aria-hidden />
                <span className="sm:hidden">{short}</span>
                <span className="hidden sm:inline">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
