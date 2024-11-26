"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination"; // shadcn pagination component
import { toast } from "sonner";
import PGCard from "@/components/specific/PGCard";

const debounce = (func: Function, delay: number) => {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const SearchPage = () => {
  const searchParams = useSearchParams();
  const [pgs, setPgs] = useState([]);
  const [city, setCity] = useState<string>(searchParams.get("city") || "");
  const [gender, setGender] = useState<string | null>(null);
  const [bhk, setBhk] = useState(null);
  const [minRent, setMinRent] = useState<string>("");
  const [maxRent, setMaxRent] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(false);

  const fetchPgs = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const params = new URLSearchParams({
        city,
        gender: gender || "",
        bhk: bhk || "",
        minRent,
        maxRent,
        page: String(page),
        limit: "10",
      });

      const response = await fetch(`/api/get-pgs?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPgs(data.data);
        setPagination(data.pagination);
      } else {
        toast.error(data.error || "Failed to fetch data.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchPgs = useCallback(debounce(fetchPgs, 500), [
    city,
    gender,
    bhk,
    minRent,
    maxRent,
    page,
  ]);

  const handleFilterChange = () => {
    setPage(1);
    debouncedFetchPgs();
  };

  useEffect(() => {
    handleFilterChange();
  }, [city, gender, bhk, minRent, maxRent]);

  useEffect(() => {
    fetchPgs();
  }, [page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="container mx-auto p-4 space-y-3 max-w-[1300px]">
      {/* Filter Section */}
      <div className="grid gap-4 py-4 md:grid-cols-4 sticky top-0 bg-white z-10">
        <Input
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="col-span-1"
        />
        <Select onValueChange={(value) => setGender(value)} value={gender}>
          <SelectTrigger>Gender</SelectTrigger>
          <SelectContent>
            <SelectItem value="null">Any</SelectItem>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => setBhk(value)} value={bhk}>
          <SelectTrigger>BHK</SelectTrigger>
          <SelectContent>
            <SelectItem value="null">Any</SelectItem>
            <SelectItem value="1">1 BHK</SelectItem>
            <SelectItem value="2">2 BHK</SelectItem>
            <SelectItem value="3">3 BHK</SelectItem>
            <SelectItem value="4">4 BHK</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex space-x-2">
          <Input
            placeholder="Min Rent"
            value={minRent}
            onChange={(e) => setMinRent(e.target.value)}
          />
          <Input
            placeholder="Max Rent"
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
          />
          <Button onClick={handleFilterChange} className="w-full md:w-auto">
            Search
          </Button>
        </div>
      </div>

      {/* PG Results */}
      <div className="h-[28px]">
        {pgs.length > 0 && (
          <h2 className="text-lg font-semibold">
            {pagination.total} PGs waiting to be yours in {city}
          </h2>
        )}
      </div>

      <div className="flex">
        <div className="flex-1 space-y-6">
          {pgs.map((pg: any) => (
            <PGCard key={pg.id} pg={pg} />
          ))}
        </div>
        <div className="bg-black h-[90vh] min-h-0 xl:w-[420px] sticky top-20 rounded-3xl"></div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <Pagination
          total={pagination.totalPages}
          current={page}
          onChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default SearchPage;
