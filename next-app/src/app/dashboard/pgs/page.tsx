import type { Metadata } from "next";
import { ListingsView } from "@/components/dashboard/listings-view";

export const metadata: Metadata = { title: "My listings", robots: { index: false, follow: false } };

export default function MyListingsPage() {
  return <ListingsView />;
}
