"use client";
import MembershipCard from "@/components/specific/Membership";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";
import { useAppSelector } from "@/lib/hooks";
import React, { useState } from "react";

const demoPlanes = [
  {
    title: "Free",
    price: 0,
    features: [
      "Maximum of 1 PG listing",
      "Limited management access",
      "Basic ability to edit PG details",
      "No additional features",
    ],
    link: "/login",
  },
  {
    title: "Basic",
    price: 500,
    features: [
      "Maximum of 5 PG listings",
      "Full management access",
      "Basic ability to edit PG details",
      "Callback request feature with email notification",
      "No advertising capabilities",
    ],
    link: "/login",
  },
  {
    title: "Premium",
    price: 2000,
    features: [
      "Maximum of 20 PG listings",
      "Full management access",
      "Ability to edit PG details",
      "Callback request feature with email notification",
      "Advertising feature",
    ],
    link: "/login",
  },
];
const Page = () => {
  const [amount, setAmount] = useState<number | "">("");
  const { userData } = useAppSelector((state) => state.user);
  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userData?.username) {
      console.error("User data is missing.");
      return;
    }

    if (!amount || amount <= 0) {
      console.error("Invalid amount entered.");
      return;
    }

    const data = {
      name: userData.username,
      amount,
      mobile: "6283816638",
      MUID: `MUID${Date.now()}`,
      transactionId: `TID${Date.now()}`,
    };

    console.log("Submitting payment form:", data);

    try {
      const response = await api.post("/api/payment/order", data);

      const redirectUrl =
        response.data?.data?.data?.instrumentResponse?.redirectInfo?.url;

      if (response.data.success && redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        console.error("Payment response error:", response.data);
      }
    } catch (error) {
      console.error("Payment request failed:", error);
    }
  };
  return (
    <div className="min-h-[calc(100vh-69px)] w-full flex flex-col py-8 items-center bg-primary1/10">
      <h1 className="text-2xl font-medium mb-8 text-primary1">Membership</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {demoPlanes.map((plane, index) => (
          <MembershipCard key={index} plane={plane} />
        ))}

        <form className="flex flex-col gap-4" onSubmit={handlePayment}>
          <Input
            placeholder="Enter amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || "")}
            required
          />

          <Button type="submit">Pay Now</Button>
        </form>
      </div>
    </div>
  );
};

export default Page;
