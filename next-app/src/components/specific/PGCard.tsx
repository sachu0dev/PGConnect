"use client";
import Image from "next/image";
import React from "react";
import { motion } from "framer-motion";
import { PersonStanding } from "lucide-react";

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
        <div className="h-8 w-full bg-primary1 absolute bottom-0 flex items-center justify-center text-white">
          <PersonStanding />
          <span>{pg.capacity - pg.capacityCount} people left</span>
        </div>
      </div>
      <div className="w-2/3"></div>
      {/* <CardHeader>
        <CardTitle>{pg.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{pg.description}</p>
        <p>City: {pg.city}</p>
        <p>Rent: ₹{pg.rentPerMonth}</p>
        <p>BHK: {pg.bhk}</p>
        <p>Gender: {pg.gender}</p>
      </CardContent>
      <CardFooter>
        <p>Owner: {pg.owner?.username || "N/A"}</p>
      </CardFooter> */}
    </div>
  );
};

export default PGCard;
