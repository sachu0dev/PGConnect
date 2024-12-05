"use client";
import React, { useEffect } from "react";

const Page = () => {
  useEffect(() => {
    window.location.href = "/dashboard/pgs";
  });
  return <div>page</div>;
};

export default Page;
