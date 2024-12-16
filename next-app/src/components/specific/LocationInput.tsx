"use client";

import { StandaloneSearchBox, useLoadScript } from "@react-google-maps/api";
import axios from "axios";
import { LocateFixed, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import NumberTicker from "../ui/number-ticker";
import { useRouter } from "next/navigation";

const LocationInput = () => {
  const [stats, setStats] = useState({
    pgCount: 0,
    cityCount: 0,
    bedCount: 0,
    isLoading: true,
    isLoaded: false,
    error: null as string | null,
  });

  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: ["places"],
  });

  const handleSearch = () => {
    router.push(
      `/pgs?city=${selectedCity || inputRef.current?.value || ""}&payload=${
        inputRef.current?.value || ""
      }`
    );
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get("/api/extra/get-main-headline");
      if (data.success) {
        setStats({
          pgCount: data.totalPGs,
          cityCount: data.totalCities,
          bedCount: data.totalBeds,
          isLoading: false,
          error: null,
          isLoaded: true,
        });
      }
    } catch {
      setStats((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to load statistics",
      }));
    }
  };

  const handlePlacesChanged = () => {
    if (!searchBoxRef.current) return;

    const places = searchBoxRef.current.getPlaces();

    if (places?.length) {
      const place = places[0];
      const cityComponent = place.address_components?.find((component) =>
        component.types.includes("locality")
      );
      setSelectedCity(cityComponent?.long_name ?? "");
    }
  };

  const handleLocationClick = async () => {
    setIsLocating(true);
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported");
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        }
      );

      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      const cityComponent = data.results[0]?.address_components?.find(
        (component: google.maps.GeocoderAddressComponent) =>
          component.types.includes("locality")
      );
      setSelectedCity(cityComponent?.long_name ?? "");
    } catch (error) {
      console.error("Error getting location:", error);
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (!stats.isLoaded) {
      fetchStats();
    }
  }, [stats.isLoaded]);

  if (loadError) {
    return <div className="text-red-500">Error loading Google Maps</div>;
  }

  if (!isLoaded) {
    return <div className="animate-pulse">Loading Google Maps...</div>;
  }

  const StatisticItem = ({
    icon,
    value,
    label,
  }: {
    icon: React.ReactNode;
    value: number;
    label: string;
  }) => (
    <div className="flex items-center space-x-2">
      {icon}
      <div className="whitespace-pre-wrap text-xl font-semibold flex items-center tracking-tighter text-black">
        <NumberTicker className="text-black" value={value} />+{" "}
        <span className="text-sm font-thin text-[#4e5253]">{label}</span>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[800px] shadow-md p-4 rounded-md bg-white">
      <div className="w-full flex justify-between rounded-lg overflow-hidden border border-slate-300 pl-6 mb-4">
        <StandaloneSearchBox
          onLoad={(ref) => (searchBoxRef.current = ref)}
          onPlacesChanged={handlePlacesChanged}
        >
          <input
            ref={inputRef}
            placeholder="Enter city name, area etc..."
            className="border-none outline-none text-xl w-full py-4 text-black bg-white"
            aria-label="Location search"
          />
        </StandaloneSearchBox>
        <div className="flex">
          <button
            className={`p-4 m-1 mr-2 text-primary1 bg-primary1/20 rounded-full transition-all ${
              isLocating ? "animate-spin" : ""
            }`}
            onClick={handleLocationClick}
            disabled={isLocating}
            aria-label="Get current location"
          >
            <LocateFixed size={20} />
          </button>
          <button
            className="flex py-4 text-white px-8 bg-primary1 space-x-2 items-center hover:bg-primary1/90 transition-colors"
            aria-label="Search"
            onClick={handleSearch}
          >
            <Search />
            <span>Search</span>
          </button>
        </div>
      </div>

      {stats.error ? (
        <div className="text-red-500 text-center">{stats.error}</div>
      ) : (
        <div className="flex justify-evenly items-center py-4">
          <StatisticItem
            icon={<CitySvgIcon />}
            value={stats.cityCount}
            label="Cities"
          />
          <StatisticItem
            icon={<RoomSvgIcon />}
            value={stats.pgCount}
            label="PGs"
          />
          <StatisticItem
            icon={<BedSvgIcon />}
            value={stats.bedCount}
            label="Beds"
          />
        </div>
      )}
    </div>
  );
};

const CitySvgIcon = () => (
  <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
    <circle
      cx="21"
      cy="6"
      r="5"
      fill="white"
      stroke="#60C3AD"
      strokeWidth="2"
    />
    <path
      d="M17 14.0744V17H13V11.741L17 14.0744Z"
      fill="white"
      stroke="#60C3AD"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M4 9H10C11.6569 9 13 10.3431 13 12V29H1V12C1 10.3431 2.34315 9 4 9Z"
      fill="white"
      stroke="#60C3AD"
      strokeWidth="2"
    />
    <path
      d="M9 5V9H5V5C5 3.89543 5.89543 3 7 3C8.10457 3 9 3.89543 9 5Z"
      fill="white"
      stroke="#60C3AD"
      strokeWidth="2"
    />
    <path d="M5 13H9" stroke="#60C3AD" strokeWidth="2" strokeLinecap="round" />
    <path d="M5 17H9" stroke="#60C3AD" strokeWidth="2" strokeLinecap="round" />
    <path d="M5 21H7" stroke="#60C3AD" strokeWidth="2" strokeLinecap="round" />
    <path d="M5 25H7" stroke="#60C3AD" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M14 17H26C27.6569 17 29 18.3431 29 20V29H11V20C11 18.3431 12.3431 17 14 17Z"
      fill="white"
      stroke="#60C3AD"
      strokeWidth="2"
    />
    <path
      d="M15 21H25"
      stroke="#60C3AD"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M15 25H25"
      stroke="#60C3AD"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const RoomSvgIcon = () => (
  <svg width="26" height="26" viewBox="0 0 30 30" fill="none">
    <path
      d="M18 4.56797C18 3.69621 19.0377 3.24187 19.6783 3.83317L28.6783 12.1409C28.8834 12.3302 29 12.5966 29 12.8757V28C29 28.5523 28.5523 29 28 29H18V4.56797Z"
      fill="white"
      stroke="#60C3AD"
      strokeWidth="2"
    />
    <path
      d="M23 17H29"
      stroke="#60C3AD"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M23 21H29"
      stroke="#60C3AD"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M23 25H29"
      stroke="#60C3AD"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M1 7.64399C1 7.43462 1.06572 7.23053 1.18788 7.0605L5.24302 1.41651C5.43089 1.15503 5.73317 1 6.05514 1H17C17.5523 1 18 1.44772 18 2V29H2C1.44772 29 1 28.5523 1 28V7.64399Z"
      fill="white"
      stroke="#60C3AD"
      strokeWidth="2"
    />
    <rect
      x="5"
      y="8"
      width="3"
      height="3"
      rx="1"
      fill="white"
      stroke="#60C3AD"
      strokeWidth="2"
    />
    <rect
      x="11"
      y="15"
      width="3"
      height="3"
      rx="1"
      fill="white"
      stroke="#60C3AD"
      strokeWidth="2"
    />
    <rect
      x="17"
      y="8"
      width="3"
      height="3"
      rx="1"
      fill="white"
      stroke="#60C3AD"
      strokeWidth="2"
    />
    <rect
      x="17"
      y="15"
      width="3"
      height="3"
      rx="1"
      fill="white"
      stroke="#60C3AD"
      strokeWidth="2"
    />
  </svg>
);

const BedSvgIcon = () => (
  <svg width="26" height="26" viewBox="0 0 32 30" fill="none">
    <path
      d="M31 29V17C31 14.7909 29.2091 13 27 13H5C2.79086 13 1 14.7909 1 17V29"
      stroke="#60C3AD"
      strokeWidth="2"
      strokeLinecap="round"
    ></path>
    <path
      d="M27 12V5C27 2.79086 25.2091 1 23 1H9C6.79086 1 5 2.79086 5 5V12"
      stroke="#60C3AD"
      strokeWidth="2"
      strokeLinecap="round"
    ></path>
    <path
      d="M19 12V10C19 8.34315 17.6569 7 16 7V7C14.3431 7 13 8.34315 13 10V12"
      stroke="#60C3AD"
      strokeWidth="2"
      strokeLinecap="round"
    ></path>
    <path
      d="M1 24H31"
      stroke="#60C3AD"
      strokeWidth="2"
      strokeLinecap="round"
    ></path>
  </svg>
);

export default LocationInput;
