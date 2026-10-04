"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  PhoneCall,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/providers/auth-provider";
import { initials } from "@/lib/format";

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Account menu"
      >
        {initials(user.username)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate font-semibold">{user.username}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account"><UserRound /> Account</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/saved"><Heart /> Saved PGs</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/enquiries"><PhoneCall /> My enquiries</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/chat"><MessageSquareText /> Messages</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.isOwner ? (
          <DropdownMenuItem asChild>
            <Link href="/dashboard"><LayoutDashboard /> Owner dashboard</Link>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href="/owners"><Building2 /> List your PG</Link>
          </DropdownMenuItem>
        )}
        {user.isAdmin ? (
          <DropdownMenuItem asChild>
            <Link href="/admin"><ShieldCheck /> Admin</Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={async () => {
            await logout();
            router.push("/");
            router.refresh();
          }}
        >
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
