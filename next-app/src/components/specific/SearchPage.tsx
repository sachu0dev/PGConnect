import Loader from "@/components/layout/Loader";
import PGCard from "@/components/specific/PGCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  fetchPGs,
  Pagination as PaginationType,
} from "../../helpers/TypeHelper";
import Image from "next/image";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  Libraries,
} from "@react-google-maps/api";
import { LoaderCircle } from "lucide-react";
import { Pg } from "@prisma/client";

interface ExtendedPg extends Pg {
  contact: string;
  isDummy: boolean;
  isAcceptingGuest: boolean;
  updatedAt: Date;
  ownerId: string;
}

const SearchPage = () => {
  const searchParams = useSearchParams();
  const [pgs, setPgs] = useState<ExtendedPg[]>([]);
  const [find, setFind] = useState<string>(searchParams.get("find") || "");
  const [gender, setGender] = useState<string | undefined>("");
  const [bhk, setBhk] = useState<string | undefined>("");
  const [minRent, setMinRent] = useState<string>("");
  const [maxRent, setMaxRent] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [center, setCenter] = useState({ lat: 28.6139, lng: 77.209 });
  const [pagination, setPagination] = useState<PaginationType>({
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);

  const libraries: Libraries = useMemo(() => ["places"], []);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: libraries,
  });

  // Fetch PGs with debounce
  const fetchAndSetPgs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPGs({
        find,
        gender,
        bhk,
        minRent,
        maxRent,
        page,
        limit: 10,
      });
      if (data.success) {
        setPgs(data.data);
        setPagination(data.pagination);
        if (data.data.length > 0 && data.data[0].coordinates) {
          const [lat, lng] = data.data[0].coordinates.split(",").map(Number);
          setCenter({ lat, lng });
        }
      } else {
        toast.error(data.error || "Failed to fetch data.");
      }
    } catch (error) {
      console.log(error);
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [find, gender, bhk, minRent, maxRent, page]);

  useEffect(() => {
    fetchAndSetPgs();
  }, [fetchAndSetPgs]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  };

  // Handle card hover
  const handleCardHover = (coordinates: string) => {
    if (coordinates) {
      const [lat, lng] = coordinates.split(",").map(Number);
      setCenter({ lat, lng });
    }
  };

  // Render map
  const renderMap = () => {
    if (loadError) {
      return (
        <div className="flex justify-center items-center w-full h-full">
          {" "}
          Error loading maps{" "}
        </div>
      );
    }
    if (!isLoaded) {
      return (
        <div className="flex justify-center items-center w-full h-full">
          {" "}
          <LoaderCircle className="animate-spin" />{" "}
        </div>
      );
    }
    return (
      <GoogleMap
        center={center}
        zoom={15}
        mapContainerStyle={{ width: "100%", height: "100%" }}
      >
        <Marker position={center} />
      </GoogleMap>
    );
  };

  return (
    <div className="container mx-auto p-4 space-y-3 max-w-[1300px]">
      {/* Filter Section */}
      <div className="grid gap-4 py-4 md:grid-cols-4 sticky top-0 bg-white z-10">
        <Input
          type="text"
          placeholder="Search PG"
          value={find}
          onChange={(e) => setFind(e.target.value)}
        />
        <Select value={gender} onValueChange={(value) => setGender(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
          </SelectContent>
        </Select>

        <Select value={bhk} onValueChange={(value) => setBhk(value)}>
          <SelectTrigger>
            <SelectValue placeholder="BHK" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="1">1 BHK</SelectItem>
            <SelectItem value="2">2 BHK</SelectItem>
            <SelectItem value="3">3 BHK</SelectItem>
            <SelectItem value="4">4 BHK</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex space-x-2">
          <Input
            type="number"
            placeholder="Min Rent"
            value={minRent}
            onChange={(e) => setMinRent(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Max Rent"
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
          />
        </div>
      </div>

      {/* PG Results */}
      <div className="h-[28px]">
        {pgs.length > 0 && (
          <h2 className="text-lg font-semibold">
            {pagination.total} PGs waiting to be yours in {find}
          </h2>
        )}
      </div>

      <div className="flex">
        <div className="flex-1 space-y-6">
          {!loading ? (
            pgs.length > 0 ? (
              pgs.map((pg) => (
                <div
                  key={pg.id}
                  onMouseEnter={() => handleCardHover(pg.coordinates)}
                >
                  <PGCard pg={pg} />
                </div>
              ))
            ) : (
              <div className="flex justify-center flex-col items-center h-[50vh] space-y-4">
                <Image
                  src="https://res.cloudinary.com/stanza-living/image/upload/v1654161141/Website%20v5/Common/modal-error.png"
                  alt="icon"
                  width={300}
                  height={300}
                />
                <h1 className="text-3xl text-primary1 font-medium">
                  Keep looking, friend
                </h1>
                <div className="flex flex-col justify-center items-center text-lg font-medium">
                  <span>We couldn&lsquo;t keep up with your filters. </span>
                  <span>Try expanding your search?</span>
                </div>
              </div>
            )
          ) : (
            <div className="flex justify-center items-center h-[50vh]">
              <Loader />
            </div>
          )}
        </div>
        <div className="bg-slate-100 h-[90vh] hidden md:w-[200px] md:block xl:w-[420px] sticky top-20 rounded-3xl overflow-hidden">
          {renderMap()}
        </div>
      </div>

      {/* Custom Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={!pagination.hasPrevPage}
            className={`px-4 py-2 border ${
              !pagination.hasPrevPage
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            Previous
          </button>

          {[...Array(pagination.totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              className={`px-4 py-2 border ${
                page === index + 1
                  ? "bg-blue-500 text-white"
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              {index + 1}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={!pagination.hasNextPage}
            className={`px-4 py-2 border ${
              !pagination.hasNextPage
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
