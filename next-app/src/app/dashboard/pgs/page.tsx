"use client";

import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/axios";
import { ApiResponse } from "@/types/response";
import { Pg } from "@prisma/client";
import { IconCoin, IconHome, IconMapPin, IconUsers } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const truncate = (text: string, maxLength: number = 80) => {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};
const Page = () => {
  const [pgsData, setPgsData] = useState<Pg[]>([]);

  const fetchOwnersPgs = async () => {
    try {
      const response = await api.get<ApiResponse<Pg[]>>("/api/dashboard/pgs");
      if (response.data.success) {
        setPgsData(response.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchOwnersPgs();
  }, []);

  return (
    <div className="flex flex-1">
      <div className="p-2 md:p-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full text-gray-700 overflow-y-auto">
        <div className=" flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Your PGs</h2>
          <div className="text-sm text-slate-500">PGs: {pgsData.length}</div>
        </div>
        <div className="w-full h-[500px] ">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {pgsData.length === 0
              ? [...Array(10)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-xl p-4 shadow-sm flex flex-col space-y-3"
                  >
                    <Skeleton className="w-full h-40 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                    <div className="space-y-2 mt-auto">
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  </div>
                ))
              : pgsData.map((pg, index) => (
                  <Link
                    key={index}
                    href={`/dashboard/pgs/${pg.id}`}
                    className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
                  >
                    <div className="w-full h-40 overflow-hidden rounded-xl mb-3">
                      {pg.images && pg.images.length > 0 ? (
                        <Image
                          src={pg.images[0]}
                          alt={pg.name}
                          className="w-full h-full object-cover"
                          width={500}
                          height={300}
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                          <IconHome className="w-12 h-12 text-neutral-400" />
                        </div>
                      )}
                    </div>

                    {/* Title and Description */}
                    <div className="mb-3">
                      <h3 className="font-semibold text-lg truncate mb-1">
                        {truncate(pg.name, 30)}
                      </h3>
                      <p className="text-neutral-600 text-sm">
                        {truncate(
                          pg.description || "No description available",
                          100
                        )}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mt-auto">
                      <div className="flex items-center text-neutral-600 text-sm">
                        <IconMapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {pg.city}, {pg.bhk} BHK
                        </span>
                      </div>
                      <div className="flex items-center text-neutral-600 text-sm">
                        <IconCoin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>₹{pg.rentPerMonth}/month</span>
                      </div>
                      <div className="flex items-center text-neutral-600 text-sm">
                        <IconUsers className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>
                          {pg.capacity} {pg.gender} Capacity
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
