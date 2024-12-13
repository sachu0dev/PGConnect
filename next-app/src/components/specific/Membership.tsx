"use client";

import { Check, IndianRupee } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import axios from "axios";
import { useState } from "react";
import { useAppSelector } from "@/lib/hooks";

interface MembershipCardProps {
  tag: string;
  title: string;
  price: number;
  features: string[];
  link?: string;
}

const MembershipCard = ({ plane }: { plane: MembershipCardProps }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { userData } = useAppSelector((state) => state.user);

  const handleSubscribe = async () => {
    if (!userData) {
      toast.error("Please log in to subscribe to a membership");
      return;
    }

    const recurringDetailsMap = {
      FREE: { frequency: "MONTHLY", maxCharges: 1 },
      BASIC: { frequency: "MONTHLY", maxCharges: 12 },
      PREMIUM: { frequency: "YEARLY", maxCharges: 1 },
    };

    try {
      setIsProcessing(true);
      const response = await axios.post("/api/payment/subscribe", {
        planId: plane.tag,
        amount: plane.price,
        userId: userData.id,
        ...recurringDetailsMap[plane.tag as keyof typeof recurringDetailsMap],
      });

      if (response.data.success) {
        window.location.href = response.data.paymentUrl;
      } else {
        toast.error("Failed to initiate subscription: " + response.data.error);
      }
    } catch (error) {
      console.log("Subscription error:", error);
      toast.error("An error occurred while processing your subscription");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 w-[400px] bg-primary1 rounded-xl flex flex-col justify-between gap-4 text-white">
      <div>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">{plane.title}</h3>
          {plane.tag !== "FREE" && (
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
              {plane.tag} PLAN
            </span>
          )}
        </div>
        <h1 className="flex items-center text-3xl font-bold mt-4">
          <IndianRupee />
          {plane.price === 0 ? "Free" : plane.price}
        </h1>
        <span className="text-xs">
          {plane.tag === "FREE"
            ? "Always free"
            : plane.tag === "BASIC"
            ? "Monthly payment"
            : "Yearly payment"}
        </span>
        <div className="h-[1px] bg-gray-200 my-4"></div>
        {plane.features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2 my-2">
            <Check />
            <span>{feature}</span>
          </div>
        ))}
      </div>
      <div>
        <Button
          onClick={handleSubscribe}
          disabled={isProcessing}
          className="bg-white text-primary1 w-full rounded-full hover:bg-white/90 mb-2"
        >
          {isProcessing ? "Processing..." : "Subscribe"}
        </Button>
        <div className="w-full text-xs text-center"></div>
      </div>
    </div>
  );
};

export default MembershipCard;
