"use client";
import useAuth from "@/hooks/userAuth";
import { motion } from "framer-motion";
import {
  BadgeDollarSign,
  Bed,
  GitCommitHorizontal,
  LayoutDashboard,
  LogOut,
  User,
} from "lucide-react";
import Link from "next/link";
import { useAppSelector } from "../../lib/hooks";
import { RootState } from "../../lib/store";
// import { ThemeToggler } from "../specific/ThemeToggler";

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
          className="absolute z-30 w-full max-w-[500px] mx-4 flex flex-col text-black bg-white dark:bg-dark-surface-low  dark:text-slate-400 shadow-md lg:hidden"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {/* Navigation Links */}
          <nav className="flex flex-col w-full">
            <Link
              href="/pgs"
              className="p-4 w-full flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-secondary1-dark/90 transition-colors"
            >
              <Bed size={24} color={"#60C3AD"} />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Find a Pg</span>
                <span className="text-xs text-gray-500">Get your pg now</span>
              </div>
            </Link>
            <Link
              href="/dashboard/pgs"
              className="p-4 w-full flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-secondary1-dark/90 transition-colors"
            >
              <LayoutDashboard size={24} color={"#60C3AD"} />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">For Pg Owners</span>
                <span className="text-xs text-gray-500">Mannage your Pgs</span>
              </div>
            </Link>
            <Link
              href="/membership"
              className="p-4 w-full flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-secondary1-dark/90 transition-colors"
            >
              <BadgeDollarSign size={24} color={"#60C3AD"} />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">Become a Member</span>
                <span className="text-xs text-gray-500">More Benefits</span>
              </div>
            </Link>
          </nav>

          {/* User Section */}
          <div className="flex justify-evenly p-4">
            {userData ? (
              <div className="flex space-x-2 font-semibold items-center">
                <User size={24} aria-label="User Icon" color={"#60C3AD"} />
                <Link href="/profile" className="hover:underline">
                  {userData.username}
                </Link>
                <button
                  onClick={logoutHandler}
                  className="cursor-pointer hover:underline text-red-500"
                  aria-label="Logout"
                >
                  <LogOut size={20} />
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
            {/* <div className="flex space-x-2 font-semibold items-center">
              <ThemeToggler />
            </div> */}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MobileNav;
