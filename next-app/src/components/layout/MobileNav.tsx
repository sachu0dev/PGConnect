"use client";
import React from "react";
import { useAppSelector } from "../../lib/hooks";
import { RootState } from "../../lib/store";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeDollarSign,
  Building,
  GitCommitHorizontal,
  User,
} from "lucide-react";
import useAuth from "@/hooks/userAuth";

const MobileNav = () => {
  const { isNavMenuOpen } = useAppSelector((state: RootState) => state.misc);
  const userData = useAppSelector((state: RootState) => state.user.userData);

  const { logOut } = useAuth();

  const logoutHandler = async () => {
    await logOut();
  };

  return (
    <div className="flex justify-center relative">
      {isNavMenuOpen && (
        <motion.div
          className="absolute w-full max-w-[500px] mx-4 bg-white flex flex-col text-black shadow-md md:hidden"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {/* Navigation Links */}
          <nav className="flex flex-col w-full">
            <Link
              href="/membership"
              className="p-4 w-full flex items-center space-x-2 hover:bg-gray-100 transition-colors"
            >
              <BadgeDollarSign size={24} />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Become a Member</span>
                <span className="text-xs text-gray-500">More Benefits</span>
              </div>
            </Link>
            <Link
              href="/post"
              className="p-4 w-full flex items-center space-x-2 hover:bg-gray-100 transition-colors"
            >
              <Building size={24} />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">
                  List your Property
                </span>
                <span className="text-xs text-gray-500">For free</span>
              </div>
            </Link>
          </nav>

          {/* User Section */}
          <div className="flex justify-center p-4">
            {userData ? (
              <div className="flex space-x-2 font-semibold items-center">
                <User size={24} aria-label="User Icon" />
                <Link href="/profile" className="hover:underline">
                  {userData.username}
                </Link>
                <GitCommitHorizontal className="rotate-90" aria-hidden="true" />
                <button
                  onClick={logoutHandler}
                  className="cursor-pointer hover:underline text-red-500"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex space-x-2 font-semibold items-center">
                <User size={24} aria-label="User Icon" />
                <Link href="/login" className="hover:underline">
                  Login
                </Link>
                <GitCommitHorizontal className="rotate-90" aria-hidden="true" />
                <Link href="/register" className="hover:underline">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MobileNav;
