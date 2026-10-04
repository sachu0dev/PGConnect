import type { Metadata } from "next";
import { ListingsPanel } from "@/components/admin/listings-panel";

export const metadata: Metadata = { title: "Listings" };

export default function AdminListingsPage() {
  return <ListingsPanel />;
}
