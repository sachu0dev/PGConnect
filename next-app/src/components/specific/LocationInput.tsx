import { LocateFixed, Search } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";

const LocationInput = () => {
  return (
    <div className="w-full max-w-[800px] shadow-md p-4  rounded-md">
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
