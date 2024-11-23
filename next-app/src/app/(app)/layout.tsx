"use client";
import { RootState } from "@/lib/store";
import Header from "../../components/layout/Header";
import MobileNav from "../../components/layout/MobileNav";
import Loader from "@/components/layout/Loader";
import Image from "next/image";
import { useAppSelector } from "@/lib/hooks";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const loading = useAppSelector((state: RootState) => state.user.loading);

  return (
    <>
      {loading ? (
        <div className=" relative h-screen w-screen flex justify-center items-center bg-[url('/assets/headline-bg.png')] bg-repeat-x bg-bottom">
          <Loader />
          <div className="absolute bottom-0 w-full">
            <Image
              className="w-full"
              src={"/assets/city-slider.png"}
              alt="city slider"
              width={2000}
              height={500}
            />
          </div>
        </div>
      ) : (
        <>
          <Header />
          <MobileNav />
          {children}
        </>
      )}
      <Toaster />
    </>
  );
}
