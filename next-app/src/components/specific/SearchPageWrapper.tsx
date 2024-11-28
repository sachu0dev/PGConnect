"use client";

import { Suspense } from "react";

import { LoaderCircle } from "lucide-react";
import SearchPage from "./SearchPage";

const SearchPageWrapper = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <LoaderCircle className="animate-spin" />
        </div>
      }
    >
      <SearchPage />
    </Suspense>
  );
};

export default SearchPageWrapper;
