"use client";
import useAuth from "@/hooks/userAuth";
import api from "@/lib/axios";
import { setUser } from "@/lib/features/user/userSlice";
import {
  BadgeDollarSign,
  Building,
  GitCommitHorizontal,
  Menu,
  Slash,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { closeNavMenu, openNavMenu } from "../../lib/features/misc/miscSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import { RootState } from "../../lib/store";

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

  const fetchUserProfile = async () => {
    if (!accessToken) {
      console.log("Access token is missing, waiting for refresh...");
      return;
    }
    try {
      const response = await api.get("/api/profile");
      const user = response.data.User;
      console.log(user);
      dispatch(setUser(user));
    } catch (error) {
      console.log("Error fetching user profile", error);
    }
  };

  useEffect(() => {
    if (!loading && accessToken) {
      fetchUserProfile();
    }
  }, [loading]);

  const handelClose = () => {
    dispatch(closeNavMenu());
  };

  const logoutHandler = async () => {
    logOut();
  };

  return (
    <div className="bg-white min-h-[69px] flex justify-between  items-center px-6 md:pl-12 text-black border-b border-slate-200">
      <div>
        <Link href="/">
          <Image src={"/icons/logo.png"} alt="logo" width={200} height={80} />
        </Link>
      </div>
      <div className="hidden md:flex  text-black ">
        <Link
          href="/membership"
          className="h-full flex justify-center space-x-2 border-r border-slate-200 pr-4 py-4"
        >
          <div className="flex items-center">
            <BadgeDollarSign size={24} />
          </div>
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-sm">Become a Member</h3>
            <span className="text-xs text-slate-500">More Benefits</span>
          </div>
        </Link>
        <Link
          href="/post-pg"
          className="h-full flex justify-center space-x-2 border-r border-slate-200 p-4 "
        >
          <div className="flex items-center">
            <Building size={30} />
          </div>
          <div className="flex flex-col items-center">
            <h3 className="font-semibold text-sm">List your property</h3>
            <span className="text-xs text-slate-500">For free</span>
          </div>
        </Link>
        <div className="h-full flex justify-center space-x-2 p-4">
          <div className="flex items-center justify-center">
            <User size={30} />
          </div>
          <div className="flex flex-col items-center">
            {userData ? (
              <div className="hidden md:flex space-x-2  font-semibold text-sm ">
                <Link href="/profile">{userData.username}</Link>
                <span>/</span>
                <div onClick={logoutHandler} className="cursor-pointer ">
                  Logout
                </div>
              </div>
            ) : (
              <div className="hidden md:flex space-x-2   font-semibold text-sm ">
                <Link href="/login">Login</Link>
                <span>/</span>

                <Link href="/register">Sign up</Link>
              </div>
            )}
            <span className="text-xs text-slate-500">
              Register to use our services
            </span>
          </div>
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
        <button className="flex md:hidden" onClick={handelOpen}>
          <Menu />
        </button>
      )}
      {isNavMenuOpen && (
        <button className="flex md:hidden" onClick={handelClose}>
          <X />
        </button>
      )}
    </div>
  );
};

export default Header;
