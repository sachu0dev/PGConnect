import type { Metadata } from "next";
import { VerificationsPanel } from "@/components/admin/verifications-panel";

export const metadata: Metadata = { title: "Owner verifications" };

export default function AdminVerificationsPage() {
  return <VerificationsPanel />;
}
