"use client";
import { useAppSelector } from "@/lib/hooks";
import { useEffect } from "react";

const Page = () => {
  const { userData } = useAppSelector((state) => state.user);
  useEffect(() => {
    if (userData?.isOwner === undefined) return;

    if (userData?.isOwner) {
      window.location.href = "/dashboard/pgs";
    } else {
      window.location.href = "/dashboard/verify-owner";
    }
  }, [userData]);
  return <div>page</div>;
};

export default Page;
