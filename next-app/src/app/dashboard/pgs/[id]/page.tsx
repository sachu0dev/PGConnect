import type { Metadata } from "next";
import { EditListingView } from "@/components/dashboard/edit-listing-view";

export const metadata: Metadata = { title: "Edit listing", robots: { index: false, follow: false } };

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditListingView id={id} />;
}
