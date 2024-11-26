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
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [gender, setGender] = useState(null);
  const [bhk, setBhk] = useState(null);
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(false);

  const fetchPgs = async () => {
    if (loading) return; // Prevent fetching while loading
    setLoading(true); // Set loading state to true

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
        setPgs((prevPgs) => [...prevPgs, ...data.data]);
        setPagination(data.pagination);
      } else {
        toast.error(data.error || "Failed to fetch data.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false); // Reset loading state after the request completes
    }
  };

  const debouncedFetchPgs = debounce(fetchPgs, 500);

  const handleScroll = useCallback(
    (event: any) => {
      const bottom =
        event.target.scrollHeight ===
        event.target.scrollTop + event.target.clientHeight;
      if (bottom && pagination.hasNextPage && !loading) {
        setPage((prev) => prev + 1);
      }
    },
    [pagination, loading]
  );

  useEffect(() => {
    debouncedFetchPgs();
  }, [city, gender, bhk, minRent, maxRent, page]);

  useEffect(() => {
    const container = document.getElementById("scroll-container");
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  const handleSearch = () => {
    setPage(1);
    setPgs([]);
    fetchPgs();
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-[1300px]">
      <h1 className="text-2xl font-bold">Search Results</h1>
      <div className="grid gap-4 md:grid-cols-4">
        <Input
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="col-span-1"
        />
        <Select onValueChange={setGender} value={gender}>
          <SelectTrigger>Gender</SelectTrigger>
          <SelectContent>
            <SelectItem value="null">Any</SelectItem>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={setBhk} value={bhk}>
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
          <Button onClick={handleSearch} className="w-full md:w-auto">
            Search
          </Button>
        </div>
      </div>

      <div className="h-[28px]">
        {pgs && pgs.length > 0 && (
          <h2 className="text-lg font-semibold">
            {pagination.total} PGs waiting to be yours in {city}
          </h2>
        )}
      </div>

      <div id="scroll-container" className="overflow-y-auto h-[70vh]">
        <div className="">
          {pgs.map((pg: any) => (
            <PGCard key={pg.id} pg={pg} />
          ))}
        </div>
        {loading && <div>Loading...</div>}
      </div>
    </div>
  );
};

export default SearchPage;
