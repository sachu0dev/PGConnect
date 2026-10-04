import type { Metadata } from "next";
import { CreateListingView } from "@/components/dashboard/create-listing-view";

export const metadata: Metadata = { title: "Add your PG", robots: { index: false, follow: false } };

export default function PostPgPage() {
  return <CreateListingView />;
}
