import type { Metadata } from "next";
import { OverviewView } from "@/components/dashboard/overview-view";

export const metadata: Metadata = { title: "Owner dashboard", robots: { index: false, follow: false } };

export default function DashboardPage() {
  return <OverviewView />;
}
