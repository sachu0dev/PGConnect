import type { Metadata } from "next";
import { SavedList } from "@/components/account/saved-list";

export const metadata: Metadata = { title: "Saved PGs" };

export default function SavedPage() {
  return (
    <section aria-labelledby="saved-heading">
      <h2 id="saved-heading" className="mb-1 text-xl font-semibold">Saved PGs</h2>
      <SavedList />
    </section>
  );
}
