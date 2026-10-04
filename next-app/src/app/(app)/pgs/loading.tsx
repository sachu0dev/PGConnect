import { Skeleton } from "@/components/ui/skeleton";
import { ResultsGridSkeleton } from "@/components/search/results-grid";

export default function SearchLoading() {
  return (
    <div aria-busy="true" aria-label="Loading PGs">
      <div className="border-b bg-gradient-to-b from-secondary/60 to-background">
        <div className="container space-y-4 py-6 md:py-8">
          <Skeleton className="h-[60px] w-full rounded-2xl" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="container grid gap-8 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-8">
        <Skeleton className="hidden h-[540px] rounded-xl lg:block" />
        <div className="space-y-5">
          <div className="flex justify-between">
            <Skeleton className="h-10 w-28 lg:invisible" />
            <Skeleton className="h-10 w-44" />
          </div>
          <ResultsGridSkeleton />
        </div>
      </div>
    </div>
  );
}
