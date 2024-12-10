"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  GoogleMap,
  Marker,
  StandaloneSearchBox,
  useJsApiLoader,
} from "@react-google-maps/api";
import { LocateFixed, MapPin, Search } from "lucide-react";
import api from "@/lib/axios";
import { ApiResponse } from "@/types/response";
import { AxiosError } from "axios";

// Styles
const containerStyle = {
  width: "100%",
  height: "300px",
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.209,
};

interface AddressComponent {
  long_name: string;
  types: string[];
}

interface AddressUpdateProps {
  pgId: string | undefined | string[];
  fetchPgDetails: () => void;
}

const AddressUpdate: React.FC<AddressUpdateProps> = ({
  pgId,
  fetchPgDetails,
}) => {
  const [center, setCenter] = useState(defaultCenter);
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: ["places", "maps"],
  });

  // Fetch address using latitude and longitude
  const fetchAddress = useCallback(async () => {
    const { lat, lng } = center;

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch address");
      }

      const data = await response.json();

      if (data.status === "OK") {
        const locationAddress =
          data.results[0]?.formatted_address || "Unknown Address";
        const cityComponent = data.results[0]?.address_components.find(
          (comp: AddressComponent) => comp.types.includes("locality")
        )?.long_name;

        setAddress(locationAddress);
        setCity(cityComponent || "Unknown City");
      } else {
        toast.error("Could not fetch address. Try again.");
      }
    } catch (error) {
      console.log("Error fetching address:", error);
      toast.error("Error fetching address.");
    }
  }, [center]);

  // Debounce address fetching
  useEffect(() => {
    const debounceTimeout = setTimeout(fetchAddress, 500);
    return () => clearTimeout(debounceTimeout);
  }, [center, fetchAddress]);

  // Handle map drag
  const handleMapDragEnd = () => {
    if (mapRef.current) {
      const newCenter = {
        lat: mapRef.current.getCenter()?.lat() || 0,
        lng: mapRef.current.getCenter()?.lng() || 0,
      };
      setCenter(newCenter);
    }
  };

  // Handle place search
  const handlePlacesChanged = () => {
    const places = searchBoxRef.current?.getPlaces();
    if (places && places.length > 0) {
      const location = places[0].geometry?.location;
      if (location) {
        setCenter({ lat: location.lat(), lng: location.lng() });
      }
    }
  };

  // Handle current location
  const handleUseCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        setCenter({ lat: latitude, lng: longitude });
      },
      () => toast.error("Unable to retrieve location."),
      { enableHighAccuracy: true }
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put<ApiResponse>(
        "/api/dashboard/update/address",
        {
          pgId,
          address,
          city,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchPgDetails();
      } else {
        toast.error(response.data.message || "Something went wrong.");
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <p>Loading Map...</p>;

  return (
    <div className="p-4 bg-white rounded shadow-sm">
      <div className="relative mb-4">
        <StandaloneSearchBox
          onLoad={(ref) => (searchBoxRef.current = ref)}
          onPlacesChanged={handlePlacesChanged}
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search for a location"
              className="w-full p-2 pl-10 border rounded focus:outline-none"
            />
            <div className="absolute top-2 left-2 text-gray-400">
              <MapPin />
            </div>
            <div className="absolute top-2 right-2 text-gray-400">
              <Search />
            </div>
          </div>
        </StandaloneSearchBox>
      </div>

      <div className="relative">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          onDragEnd={handleMapDragEnd}
          onLoad={(map) => {
            mapRef.current = map;
          }}
        >
          <Marker position={center} />
        </GoogleMap>

        <button
          onClick={handleUseCurrentLocation}
          className="absolute bottom-4 right-4 flex items-center px-4 py-2 bg-primary1 text-white rounded"
        >
          <LocateFixed className="mr-2" /> Use Current Location
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="city" className="block font-medium">
            City
          </label>
          <input
            type="text"
            id="city"
            value={city}
            readOnly
            disabled
            className="w-full mt-1 p-2 border rounded bg-gray-100"
          />
        </div>

        <div>
          <label htmlFor="address" className="block font-medium">
            Address
          </label>
          <textarea
            id="address"
            value={address}
            readOnly
            disabled
            className="w-full mt-1 p-2 border rounded bg-gray-100"
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-primary1 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Address"}
        </button>
      </form>
    </div>
  );
};

export default AddressUpdate;
