import type { Metadata } from "next";
import { AccountNav } from "@/components/account/account-nav";

export const metadata: Metadata = {
  title: { default: "My account", template: "%s | PGConnect" },
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container max-w-6xl py-6 sm:py-10">
      <div className="mb-6 space-y-4 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My account</h1>
        <AccountNav />
      </div>
      {children}
    </div>
  );
}
