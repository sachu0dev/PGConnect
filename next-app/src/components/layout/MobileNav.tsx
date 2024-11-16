"use client";
import React from "react";
import { useAppSelector } from "../../lib/hooks";
import { RootState } from "../../lib/store";
import Link from "next/link";
import { motion } from "framer-motion";

const MobileNav = () => {
  const { isNavMenuOpen } = useAppSelector((state: RootState) => state.misc);

  return (
    <div className="flex justify-center relative">
      {isNavMenuOpen && (
        <motion.div
          className="absolute  w-full max-w-[500px] mx-4 bg-[#014073] flex md:hidden text-white"
          initial={{ y: -100, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
        >
          <div className="flex flex-col w-full">
            <Link className="p-4 w-full" href="/">
              Home
            </Link>
            <Link className="p-4 w-full" href="/">
              Home
            </Link>
            <Link className="p-4 w-full" href="/">
              Home
            </Link>
            <Link className="p-4 w-full" href="/">
              Home
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MobileNav;
