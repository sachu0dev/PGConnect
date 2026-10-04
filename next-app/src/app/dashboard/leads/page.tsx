import type { Metadata } from "next";
import { LeadsView } from "@/components/dashboard/leads-view";

export const metadata: Metadata = { title: "Leads", robots: { index: false, follow: false } };

export default function LeadsPage() {
  return <LeadsView />;
}
