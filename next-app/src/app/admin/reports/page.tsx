import type { Metadata } from "next";
import { ReportsPanel } from "@/components/admin/reports-panel";

export const metadata: Metadata = { title: "Reports" };

export default function AdminReportsPage() {
  return <ReportsPanel />;
}
