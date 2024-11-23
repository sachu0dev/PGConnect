"use client";
import axios from "axios";
import { LocateFixed, Search } from "lucide-react";
import React, { useEffect, useState } from "react";

const LocationInput = () => {
  const [mainHeadline, setMainHeadline] = useState({
    pgCount: "",
    cityCount: "",
    success: false,
  });
  const fetchMainHeading = async () => {
    const res = await axios.get("/api/extra/get-main-headline");
    console.log(res.data);
    if (res.data.success) {
      setMainHeadline({
        pgCount: res.data.totalPGs,
        cityCount: res.data.totalCities,
        success: true,
      });
    }
  };
  useEffect(() => {
    fetchMainHeading();
  }, []);
  return (
    <div className="w-full max-w-[800px] shadow-md p-4  rounded-md">
      <div className="flex justify-center items-center py-4">
        {mainHeadline.success ? (
          <h1 className="text-3xl font-bold font-inter text-black">
            Over {mainHeadline.pgCount}+ pgs and homes across{" "}
            {mainHeadline.cityCount} Cities
          </h1>
        ) : (
          <h1 className="text-3xl font-bold font-inter text-black">
            Find pg anywhere
          </h1>
        )}
      </div>
      <div className="w-full flex justify-center  border-[3px] text-black border-[#014073] pl-6 mb-4">
        <input
          placeholder="Enter city name, area etc..."
          className="border-none outline-none text-xl w-full flex-1"
        />
        <button className="p-4 text-gray-300">
          <Search />
        </button>
        <button className="flex py-4 text-white px-8 bg-[#014073] space-x-2 items-center">
          <LocateFixed size={20} />
          <span>Near me</span>
        </button>
      </div>
    </div>
  );
};

export default LocationInput;
