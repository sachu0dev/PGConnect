import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ListingNotFound() {
  return (
    <div className="container flex min-h-[60dvh] flex-col items-center justify-center py-16 text-center">
      <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
        <SearchX className="size-7" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold md:text-3xl">This PG is no longer available</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The listing may have been removed by the owner or taken down by our moderators. There are plenty of other
        verified PGs waiting for you.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/pgs">Find similar PGs</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go to home</Link>
        </Button>
      </div>
    </div>
  );
}
