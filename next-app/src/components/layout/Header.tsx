"use client";
import Link from "next/link";
import React, { useEffect } from "react";
import { RootState } from "../../lib/store";
import { GitCommitHorizontal, Menu, User, X } from "lucide-react";
import { closeNavMenu, openNavMenu } from "../../lib/features/misc/miscSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import Image from "next/image";
import api from "@/lib/axios";
import { logout, setUser } from "@/lib/features/user/userSlice";
import axios from "axios";

const Header = () => {
  const { isNavMenuOpen } = useAppSelector((state: RootState) => state.misc);
  const loading = useAppSelector((state: RootState) => state.user.loading);
  const userData = useAppSelector((state: RootState) => state.user.userData);
  const accessToken = useAppSelector(
    (state: RootState) => state.user.accessToken
  );

  const dispatch = useAppDispatch();

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
    dispatch(logout());
  };

  return (
    <div className="bg-[#014073] flex justify-between md:justify-evenly items-center p-6 text-white">
      <div>
        <Link href="/">
          <Image src={"/icons/logo.png"} alt="logo" width={80} height={80} />
        </Link>
      </div>
      <div className="hidden md:flex space-x-20 text-white ">
        <div className="hidden md:flex space-x-6 text-white ">
          <Link href="/">Home</Link>
          <Link href="/">Home</Link>
          <Link href="/">Home</Link>
          <Link href="/">Home</Link>
        </div>
        {userData ? (
          <div className="hidden md:flex space-x-2 text-white font-semibold">
            <User />
            <Link href="/profile">{userData.username}</Link>
            <GitCommitHorizontal className="rotate-90" />
            <div onClick={logoutHandler}>Logout</div>
          </div>
        ) : (
          <div className="hidden md:flex space-x-2 text-white font-semibold ">
            <User />
            <Link href="/login">Login</Link>
            <GitCommitHorizontal className="rotate-90" />
            <Link href="/register">Sign up</Link>
          </div>
        )}
      </div>
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
