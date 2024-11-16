"use client";
import Link from "next/link";
import React from "react";
import { RootState } from "../../lib/store";
import { GitCommitHorizontal, Menu, User, X } from "lucide-react";
import { closeNavMenu, openNavMenu } from "../../lib/features/misc/miscSlice";
import { useAppDispatch, useAppSelector } from "../../lib/hooks";
import Image from "next/image";

const Header = () => {
  const { isNavMenuOpen } = useAppSelector((state: RootState) => state.misc);
  const dispatch = useAppDispatch();

  const handelOpen = () => {
    dispatch(openNavMenu());
  };

  const handelClose = () => {
    dispatch(closeNavMenu());
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
        <div className="hidden md:flex space-x-2 text-white font-semibold ">
          <User />
          <Link href="/login">Login</Link>
          <GitCommitHorizontal className="rotate-90" />
          <Link href="/signup">Sign up</Link>
        </div>
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
