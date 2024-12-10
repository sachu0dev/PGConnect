import { Skeleton } from "../ui/skeleton";

const DetailsSkeleton = () => (
  <div className="border border-neutral-200 dark:border-neutral-700">
    <div className="border-b flex justify-between items-center p-2 border-neutral-200 dark:border-neutral-700">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-6 w-6" />
    </div>
    {[1, 2, 3, 4, 5, 6].map((_, index) => (
      <div
        key={index}
        className="border-b flex p-2 border-neutral-200 dark:border-neutral-700 font-light"
      >
        <Skeleton className="h-5 w-1/3 mr-4" />
        <Skeleton className="h-5 w-1/2" />
      </div>
    ))}
  </div>
);

// Shimmer for description section
const DescriptionSkeleton = () => (
  <div className="border border-neutral-200 dark:border-neutral-700">
    <div className="border-b flex justify-between items-center p-2 border-neutral-200 dark:border-neutral-700">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-6 w-6" />
    </div>
    <div className="p-2">
      <Skeleton className="h-[220px] w-full" />
    </div>
  </div>
);

// Shimmer for rent section
const RentSkeleton = () => (
  <div className="border border-neutral-200 dark:border-neutral-700">
    <div className="border-b flex justify-between items-center p-2 border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center">
        <Skeleton className="h-6 w-24 mr-4" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  </div>
);

// Shimmer for images section
const ImagesSkeleton = () => (
  <div className="border border-neutral-200 p-2 dark:border-neutral-700">
    <Skeleton className="h-6 w-24 mb-4" />
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((_, index) => (
        <Skeleton key={index} className="w-full h-36" />
      ))}
    </div>
  </div>
);

export { DetailsSkeleton, DescriptionSkeleton, RentSkeleton, ImagesSkeleton };
