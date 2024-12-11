"use client";
import useAuth from "@/hooks/userAuth";
import api from "@/lib/axios";
import { setUser } from "@/lib/features/user/userSlice";
import {
  BadgeDollarSign,
  Bed,
  LayoutDashboard,
  LogOut,
  Menu,
  Minus,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { closeNavMenu, openNavMenu } from "../../lib/features/misc/miscSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { RootState } from "../../lib/store";
// import { ThemeToggler } from "../specific/ThemeToggler";

const Header = () => {
  const { isNavMenuOpen } = useAppSelector((state: RootState) => state.misc);
  const loading = useAppSelector((state: RootState) => state.user.loading);
  const userData = useAppSelector((state: RootState) => state.user.userData);
  const accessToken = useAppSelector(
    (state: RootState) => state.user.accessToken
  );

  const dispatch = useAppDispatch();
  const { logOut } = useAuth();

  const handelOpen = () => {
    dispatch(openNavMenu());
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!accessToken) {
        return;
      }

      try {
        const response = await api.get("/api/profile");

        const user = response.data.User;

        dispatch(setUser(user));
      } catch (error) {
        console.log("Error fetching user profile", error);
      }
    };

    if (!loading && accessToken) {
      fetchUserProfile();
    }
  }, [loading, accessToken, dispatch]);
  const handelClose = () => {
    dispatch(closeNavMenu());
  };

  const logoutHandler = async () => {
    logOut();
  };

  return (
    <div className=" min-h-[69px] flex justify-between  items-center px-6 md:pl-12 text-black border-b  border-slate-200 dark:border-slate-800">
      <div>
        <Link href="/" className="flex">
          <h1 className="text-3xl font-extrabold text-primary1">PG</h1>
          <span className="text-primary1 text-3xl">.</span>
          <h1 className="  transform -translate-x-1 text-slate-700 dark:text-slate-400">
            CONNECT
          </h1>
        </Link>
      </div>
      <div className="hidden lg:flex  text-black ">
        <Link
          href="/pgs"
          className="h-full flex justify-center space-x-2 border-r border-slate-200 dark:border-slate-800 pr-4 py-4"
        >
          <div className="flex items-center">
            <Bed size={24} color={"#60C3AD"} />
          </div>
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-400">
              Find a Pg
            </h3>
            <span className="text-xs text-slate-500">Get your pg now</span>
          </div>
        </Link>
        <Link
          href="/dashboard"
          className="h-full flex justify-center space-x-2 border-r border-slate-200 dark:border-slate-800  p-4"
        >
          <div className="flex items-center">
            <LayoutDashboard size={24} color={"#60C3AD"} />
          </div>
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-400">
              For Pg Owners
            </h3>
            <span className="text-xs text-slate-500">Mannage your Pgs</span>
          </div>
        </Link>
        <Link
          href="/membership"
          className="h-full flex justify-center space-x-2 border-r border-slate-200 dark:border-slate-800  p-4"
        >
          <div className="flex items-center">
            <BadgeDollarSign size={24} color={"#60C3AD"} />
          </div>
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-400">
              Become a Member
            </h3>
            <span className="text-xs text-slate-500">
              More Benefits for Pg owners
            </span>
          </div>
        </Link>

        <div className="h-full flex justify-center space-x-2 p-4">
          <div className="flex items-center justify-center">
            <User size={24} color={"#60C3AD"} />
          </div>
          <div className="flex flex-col items-center ">
            {userData ? (
              <div className="hidden md:flex space-x-2  font-semibold text-sm text-slate-700 dark:text-slate-400">
                <Link
                  href="/profile"
                  className="font-semibold text-sm text-slate-700 dark:text-slate-400"
                >
                  {userData.username}
                </Link>
                <div
                  onClick={logoutHandler}
                  className="cursor-pointer text-red-400"
                >
                  <LogOut size={20} />
                </div>
              </div>
            ) : (
              <div className="hidden md:flex space-x-2   font-semibold text-smtext-slate-700 dark:text-slate-400">
                <Link
                  href="/login"
                  className="font-semibold text-sm text-slate-700 dark:text-slate-400"
                >
                  Login
                </Link>
                <Minus className="rotate-90 text-sm text-slate-700 dark:text-slate-400" />

                <Link
                  href="/register"
                  className="font-semibold text-sm text-slate-700 dark:text-slate-400"
                >
                  Sign up
                </Link>
              </div>
            )}
            <span className="text-xs text-slate-500">
              Register to use our services
            </span>
          </div>
          {/* <div className="flex flex-col items-center border-l border-slate-200 dark:border-slate-800 pl-4 h-full">
            <ThemeToggler />
          </div> */}
        </div>
      </div>
      {/* <div className="hidden md:flex space-x-20 text-white ">
        <div className="hidden md:flex space-x-6 text-white ">
          <Link href="/">Home</Link>
          <Link href="/">Home</Link>
          <Link href="/">Home</Link>
          <Link href="/">Home</Link>
        </div>
        {userData ? (
          <div className="hidden md:flex space-x-2 text-white font-semibold ">
            <User />
            <Link href="/profile">{userData.username}</Link>
            <GitCommitHorizontal className="rotate-90" />
            <div onClick={logoutHandler} className="cursor-pointer ">
              Logout
            </div>
          </div>
        ) : (
          <div className="hidden md:flex space-x-2 text-white font-semibold ">
            <User />
            <Link href="/login">Login</Link>
            <GitCommitHorizontal className="rotate-90" />
            <Link href="/register">Sign up</Link>
          </div>
        )}
      </div> */}
      {!isNavMenuOpen && (
        <button
          className="flex lg:hidden text-slate-700 dark:text-slate-400"
          onClick={handelOpen}
        >
          <Menu />
        </button>
      )}
      {isNavMenuOpen && (
        <button
          className="flex lg:hidden text-slate-700 dark:text-slate-400"
          onClick={handelClose}
        >
          <X />
        </button>
      )}
    </div>
  );
};

export default Header;
