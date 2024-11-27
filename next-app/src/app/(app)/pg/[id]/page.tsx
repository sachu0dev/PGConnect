"use client";

import Loader from "@/components/layout/Loader";
import ImageCarousel from "@/components/specific/ImageCarousel";
import { PG } from "@/helpers/pgsService";
import { ApiResponse } from "@/types/response";
import moment from "moment";
import {
  GoogleMap,
  Libraries,
  Marker,
  useLoadScript,
} from "@react-google-maps/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import axios from "axios";
import { LoaderCircle, Share2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { FaGenderless } from "react-icons/fa6";
import { IoMdFemale, IoMdMale } from "react-icons/io";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import PhoneNumberInput from "@/components/specific/PhoneNumberInput";

// Define types for map configuration
const mapContainerStyle = {
  width: "100%",
  height: "300px",
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.209,
};

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params using React.use()
  const resolvedParams = React.use(params);
  const [loading, setLoading] = useState<boolean>(true);
  const [id] = useState<string>(resolvedParams.id);
  const [pgData, setPGData] = useState<PG | null>();
  const [center, setCenter] = useState(defaultCenter);

  const libraries: Libraries = useMemo(() => ["places"], []);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries: libraries,
  });

  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "";

  const fetchPGDetails = async () => {
    try {
      const response = await axios.get<ApiResponse<PG>>(`/api/pg/get/${id}`);

      if (response.data.success) {
        setPGData(response.data.data);
        if (response.data.data.coordinates) {
          const [lat, lng] = response.data.data.coordinates
            .split(",")
            .map(Number);
          setCenter({ lat, lng });
        }
      }
    } catch (error) {
      console.error("Error fetching details:", error);
      toast.error("Failed to fetch PG details");
    } finally {
      setLoading(false);
    }
  };

  const handleShareLink = () => {
    if (baseUrl) {
      navigator.clipboard.writeText(`${baseUrl}/pg/${id}`);
      toast.success("Link copied to clipboard");
    }
  };

  useEffect(() => {
    fetchPGDetails();
  }, []);

  const renderMap = () => {
    if (loadError) {
      return (
        <div className="flex justify-center items-center w-full h-full  text-[#292d32]">
          Error loading maps. Please check your API key and network connection.
        </div>
      );
    }

    if (!isLoaded) {
      return (
        <div className="flex justify-center items-center w-full h-full">
          <LoaderCircle className="animate-spin" />
        </div>
      );
    }

    return (
      <GoogleMap
        center={center}
        zoom={15}
        mapContainerStyle={mapContainerStyle}
      >
        <Marker position={center} />
      </GoogleMap>
    );
  };

  return (
    <div className="flex justify-center w-full py-8 px-4 lg:px-20 ">
      <div className="w-full max-w-[1000px] xl:max-w-[1000px] flex flex-col">
        {!loading && pgData ? (
          <div className="flex flex-col w-full">
            <div className="flex justify-between w-full mb-2">
              <div className="flex space-x-4 items-center">
                <h1 className="text-3xl font-semibold font-sans capitalize">
                  {pgData?.name}
                </h1>
                <div>
                  {pgData?.gender === "MALE" && (
                    <div className="bg-blue-100 shadow-md text-xs font-bold flex space-x-1 items-center py-1 px-2 rounded-full">
                      Male <IoMdMale />
                    </div>
                  )}
                  {pgData?.gender === "FEMALE" && (
                    <div className="bg-pink-100 shadow-md text-xs font-bold flex space-x-1 items-center py-1 px-2 rounded-full ">
                      <span>Female</span> <IoMdFemale />
                    </div>
                  )}
                  {pgData?.gender === "ANY" && (
                    <div className="bg-green-100 shadow-md text-xs font-bold flex space-x-1 items-center py-1 px-2 rounded-full">
                      Any <FaGenderless />
                    </div>
                  )}
                </div>
              </div>
              <div onClick={handleShareLink} className="cursor-pointer">
                <Share2 />
              </div>
            </div>
            <span className="text-[#4e5253]">{pgData?.address}</span>

            <div className="w-full flex flex-col xl:flex-row gap-4 xl:h-[300px] my-4 ">
              <div className="flex justify-center items-center flex-1">
                <ImageCarousel images={pgData?.images} />
              </div>

              <div className="flex-1 sticky">{renderMap()}</div>
            </div>
            <div className="w-full flex flex-col xl:flex-row gap-4  my-4 ">
              <div className="flex-1 ">
                <p className="text-md text-[#7d7d7d]">Starts from:</p>
                <h1 className="text-3xl font-bold text-[#292d32]">
                  ₹ {pgData?.rentPerMonth}/mo*
                </h1>
                <div className="mt-4">
                  <p className="text-md text-[#7d7d7d] text-xl">Description</p>
                  <p className="text-[#4e5253]">{pgData?.description}</p>
                </div>
                <div className="mt-6">
                  <p className="text-md text-[#7d7d7d] text-xl mb-2">Details</p>
                  <div>
                    <div className="text-[#4e5253] grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[#7d7d7d]">Capacity</p>
                        <p>{pgData?.capacity}</p>
                      </div>
                      <div>
                        <p className="text-[#7d7d7d]">Capacity left</p>
                        <p>{pgData?.capacity - pgData?.capacityCount}</p>
                      </div>
                      <div>
                        <p className="text-[#7d7d7d]">Gender</p>
                        <p>{pgData?.gender}</p>
                      </div>
                      <div>
                        <p className="text-[#7d7d7d]">City</p>
                        <p>{pgData?.city}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 border-[2px] h-[172px] sticky border-primary1 bg-primary1/20 rounded-lg p-4 flex flex-col justify-center items-center">
                <div className="flex space-x-4 items-center mb-2">
                  <Avatar>
                    <AvatarFallback>{pgData?.owner.username[0]}</AvatarFallback>
                  </Avatar>

                  <h1 className="text-xl font-semibold">
                    {pgData?.owner.username}
                  </h1>
                </div>
                <div className="flex flex-col space-y-4 items-center w-full ">
                  <Button className="w-full bg-primary1 text-white hover:bg-primary1/90 font-semibold">
                    Chat with Owner
                  </Button>
                  <PhoneNumberInput />
                </div>
              </div>
            </div>
            <div className="w-full flex justify-center items-center bg-slate-100 text-slate-600 py-2 rounded-lg">
              {moment(pgData?.createdAt).fromNow()}
            </div>
          </div>
        ) : (
          <div className="p-12 flex justify-center">
            <Loader />
          </div>
        )}
      </div>
    </div>
  );
}
