"use client";
import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
import { Bed, Building, MapPin, PersonStanding, User } from "lucide-react";
import { IoMdMale, IoMdFemale } from "react-icons/io";
import { FaGenderless } from "react-icons/fa6";
import { Button } from "../ui/button";

const PGCard = ({ pg }) => {
  return (
    <div
      key={pg.id}
      className="shadow-lg w-full flex justify-between min-h-[280px] max-w-[828px] rounded-xl overflow-hidden"
    >
      <div className="w-1/3  overflow-hidden relative">
        <motion.div
          whileHover={{ scale: 1.2 }}
          transition={{ duration: 0.2 }}
          className="h-full "
        >
          <Image
            src={pg.images[0]}
            alt={pg.name}
            width={300}
            height={300}
            className=" h-full  object-cover aspect-square"
          />
        </motion.div>
        <div className="h-8 w-full bg-gradient-to-r bg-primary1 animate-flare absolute bottom-0 flex items-center justify-center text-white">
          <PersonStanding />
          <span>{pg.capacity - pg.capacityCount} Capacity Left</span>
        </div>
      </div>
      <div className="w-2/3 flex flex-col justify-between p-4">
        <div className="flex justify-between">
          <div className="flex flex-col">
            <h3 className="text-lg font-medium capitalize ">{pg.name}</h3>
            <span className="text-xs font-medium text-[#7d7d7d] capitalize">
              City: {pg.city}
            </span>
            <span className="text-xs text-[#7d7d7d] capitalize mt-2 text-ellipsis">
              Description: {pg.description}
            </span>
          </div>
          <div>
            {pg.gender === "MALE" && (
              <div className="bg-blue-100 shadow-md text-xs font-bold flex space-x-1 items-center py-1 px-2 rounded-full">
                Male <IoMdMale />
              </div>
            )}
            {pg.gender === "FEMALE" && (
              <div className="bg-pink-100 shadow-md text-xs font-bold flex space-x-1 items-center py-1 px-2 rounded-full ">
                <span>Female</span> <IoMdFemale />
              </div>
            )}
            {pg.gender === "ANY" && (
              <div className="bg-green-100 shadow-md text-xs font-bold flex space-x-1 items-center py-1 px-2 rounded-full">
                Any <FaGenderless />
              </div>
            )}
          </div>
        </div>
        <div className=" flex flex-col">
          <div className="flex">
            <div className="flex items-center space-x-2 text-xs bg-blue-100 px-2 py-1 rounded-full mb-4 ">
              <MapPin size={16} /> <span>{pg.address}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="flex items-center space-x-2 text-xs bg-primary1/20 text-primary1 px-2 py-1 rounded-full mb-4 ">
              <Building size={16} /> <span>{pg.bhk} BHK</span>
            </div>
            <div className="flex items-center space-x-2 text-xs bg-primary1/20 text-primary1 px-2 py-1 rounded-full mb-4 ">
              <User size={16} />{" "}
              <span>
                {pg.capacityCount} / {pg.capacity}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-medium text-[#7d7d7d]">
                Rent for a person
              </span>
              <div className="flex items-center">
                <span className="font-medium text-xs mr-1">₹</span>
                <span className="text-xl font-bold">{pg.rentPerMonth}</span>
                <span className="font-medium text-xs mr-1">/mo*</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button className="bg-primary1 font-medium hover:bg-primary1/80">
                START A FREE CHAT
              </Button>
              <Button className="border-[1px] hover:bg-slate-100 border-primary1 bg-white text-primary1 font-medium">
                REQUEST A CALLBACK
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PGCard;
