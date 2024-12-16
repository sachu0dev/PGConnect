"use client";
import { useState } from "react";
import { Check, IndianRupee } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useAppSelector } from "@/lib/hooks";
import api from "@/lib/axios";

interface RazorpayCheckoutOptions {
  key: string | undefined;
  subscription_id: string;
  name: string;
  description: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => void;
  modal: {
    ondismiss: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: {
      new (options: RazorpayCheckoutOptions): {
        open: () => void;
      };
    };
  }
}

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

    try {
      setIsProcessing(true);

      const response = await api.post("/api/subscriptions/create", {
        planTag: plane.tag,
      });

      if (!response.data.success) {
        toast.error(`Failed to initiate subscription: ${response.data.error}`);
        return;
      }

      const options: RazorpayCheckoutOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        subscription_id: response.data.subscriptionId,
        name: "PGCONNECT",
        description: `${plane.title} Subscription`,
        handler: async function (response) {
          try {
            const verifyResponse = await api.post("/api/subscriptions/verify", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.data.message) {
              toast.success("Subscription activated successfully!");
            } else {
              toast.error("Subscription verification failed");
            }
          } catch (verifyError) {
            toast.error("Error verifying subscription");
            console.error(verifyError);
          }
        },
        modal: {
          ondismiss: () => {
            toast.error("Payment cancelled");
          },
        },
      };

      // Create Razorpay instance and open checkout
      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      console.error("Subscription error:", error);
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
          disabled={isProcessing || plane.tag === "FREE"}
          className="bg-white text-primary1 w-full rounded-full hover:bg-white/90 mb-2"
        >
          {isProcessing
            ? "Processing..."
            : plane.tag === "FREE"
            ? "Always free"
            : "Subscribe"}
        </Button>
      </div>
    </div>
  );
};

export default MembershipCard;
