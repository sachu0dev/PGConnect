import type { Metadata } from "next";
import { EnquiriesList } from "@/components/account/enquiries-list";

export const metadata: Metadata = { title: "My enquiries" };

export default function EnquiriesPage() {
  return (
    <section aria-labelledby="enquiries-heading">
      <div className="mb-4">
        <h2 id="enquiries-heading" className="text-xl font-semibold">My enquiries</h2>
        <p className="text-sm text-muted-foreground">Callback and visit requests you&apos;ve sent to PG owners.</p>
      </div>
      <EnquiriesList />
    </section>
  );
}
