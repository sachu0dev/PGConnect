import { Skeleton } from "@/components/ui/skeleton";

export default function ListingLoading() {
  return (
    <div className="container pb-16 pt-4 md:pt-6" aria-busy="true" aria-label="Loading PG details">
      <Skeleton className="mb-4 hidden h-4 w-64 sm:block" />
      <Skeleton className="-mx-4 aspect-[4/3] rounded-none sm:mx-0 sm:rounded-xl md:aspect-auto md:h-[420px]" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="hidden h-[380px] rounded-xl lg:block" />
      </div>
    </div>
  );
}
