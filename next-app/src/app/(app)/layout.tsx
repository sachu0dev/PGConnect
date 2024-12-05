"use client";
import Loader from "@/components/layout/Loader";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { Toaster } from "sonner";
import Header from "../../components/layout/Header";
import MobileNav from "../../components/layout/MobileNav";
import Footer from "@/components/layout/Footer";

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
        </div>
      ) : (
        <>
          <Header />
          <MobileNav />
          {children}
          <Footer />
        </>
      )}
      <Toaster />
    </>
  );
}
