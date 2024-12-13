"use client";
import MembershipCard from "@/components/specific/Membership";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/lib/hooks";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";

type Membership = "FREE" | "BASIC" | "PREMIUM";
type SubscriptionStatus = "ACTIVE" | "CANCELLED" | "EXPIRED";

interface SubscriptionDetails {
  id: string;
  userId: string;
  planType: Membership;
  startDate: Date;
  nextBillingDate?: Date;
  status: SubscriptionStatus;
  merchantSubscriptionId?: string;
}
const demoPlanes = [
  {
    tag: "FREE",
    title: "Free",
    price: 0,
    features: [
      "Maximum of 1 PG listing",
      "Limited management access",
      "Basic ability to edit PG details",
      "No additional features",
    ],
  },
  {
    tag: "BASIC",
    title: "Basic",
    price: 500,
    features: [
      "Maximum of 5 PG listings",
      "Full management access",
      "Basic ability to edit PG details",
      "Callback request feature with email notification",
      "No advertising capabilities",
    ],
  },
  {
    tag: "PREMIUM",
    title: "Premium",
    price: 5000,
    features: [
      "Maximum of 20 PG listings",
      "Full management access",
      "Ability to edit PG details",
      "Callback request feature with email notification",
      "Advertising feature",
    ],
  },
];

const MembershipPage = () => {
  const { userData } = useAppSelector((state) => state.user);
  const [currentSubscription, setCurrentSubscription] =
    useState<SubscriptionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentSubscription = async () => {
      if (!userData) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `/api/payment/subscription/${userData.id}`
        );

        if (response.data.success) {
          setCurrentSubscription(response.data.subscription);
        }
      } catch (error) {
        console.log("Error fetching subscription:", error);
        toast.error("Failed to fetch current subscription");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentSubscription();
  }, [userData]);

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    try {
      const response = await axios.post("/api/payment/cancel-subscription", {
        subscriptionId: currentSubscription.id,
      });

      if (response.data.success) {
        toast.success("Subscription cancelled successfully");
        setCurrentSubscription(null);
      } else {
        toast.error("Failed to cancel subscription");
      }
    } catch (error) {
      console.log("Subscription cancellation error:", error);
      toast.error("An error occurred while cancelling the subscription");
    }
  };

  return (
    <div className="min-h-[calc(100vh-69px)] w-full flex flex-col py-8 items-center bg-primary1/10">
      <h1 className="text-2xl font-medium mb-8 text-primary1">Membership</h1>

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        currentSubscription && (
          <div className="mb-8 p-4 bg-yellow-100 rounded-lg text-center">
            <p className="text-lg font-medium">
              Current Subscription: {currentSubscription.planType}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Active since{" "}
              {new Date(currentSubscription.startDate).toLocaleDateString()}
            </p>
            <Button
              variant="destructive"
              className="mt-4"
              onClick={handleCancelSubscription}
            >
              Cancel Subscription
            </Button>
          </div>
        )
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {demoPlanes.map((plane, index) => (
          <MembershipCard key={index} plane={plane} />
        ))}
      </div>
    </div>
  );
};

export default MembershipPage;
