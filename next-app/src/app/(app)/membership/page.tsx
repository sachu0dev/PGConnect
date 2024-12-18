"use client";
import MembershipCard from "@/components/specific/Membership";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/lib/hooks";
import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { formatDistance } from "date-fns";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

type Membership = "FREE" | "BASIC" | "PREMIUM";
type SubscriptionStatus =
  | "ACTIVE"
  | "PENDING"
  | "CANCELLED"
  | "COMPLETED"
  | "PAUSED";

interface SubscriptionDetails {
  id: string;
  userId: string;
  plan: Membership;
  startDate?: Date;
  endDate?: Date;
  lastPaymentDate?: Date;
  status: SubscriptionStatus;
  razorpaySubscriptionId: string;
  amount: number;
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
      "Ability to edit PG details",
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
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (!userData) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await api.get("/api/subscriptions/current");

        if (response.data.subscription) {
          setSubscription(response.data.subscription);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
        toast.error("Failed to fetch subscription details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, [userData]);

  const getStatusIcon = (status: SubscriptionStatus) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle className="text-green-500" />;
      case "CANCELLED":
        return <XCircle className="text-red-500" />;
      case "PENDING":
        return <Clock className="text-yellow-500" />;
      case "PAUSED":
        return <AlertCircle className="text-orange-500" />;
      default:
        return <AlertCircle className="text-gray-500" />;
    }
  };

  const renderSubscriptionDetails = () => {
    if (!subscription) return null;

    return (
      <div className="w-full max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          {getStatusIcon(subscription.status)}
          Current Subscription
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium text-gray-600">Plan</p>
            <p className="font-bold">{subscription.plan} Plan</p>
          </div>
          <div>
            <p className="font-medium text-gray-600">Status</p>
            <p className="capitalize">{subscription.status.toLowerCase()}</p>
          </div>
          {subscription.startDate && (
            <div>
              <p className="font-medium text-gray-600">Start Date</p>
              <p>{new Date(subscription.startDate).toLocaleDateString()}</p>
            </div>
          )}
          {subscription.endDate && (
            <div>
              <p className="font-medium text-gray-600">Next Billing</p>
              <p>
                {formatDistance(new Date(subscription.endDate), new Date(), {
                  addSuffix: true,
                })}
              </p>
            </div>
          )}
          <div>
            <p className="font-medium text-gray-600">Amount</p>
            <p>₹{subscription.amount}</p>
          </div>
        </div>
      </div>
    );
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    try {
      const response = await api.post("/api/subscriptions/cancel", {
        subscriptionId: subscription.razorpaySubscriptionId,
      });

      if (response.data.success) {
        toast.success("Subscription cancelled successfully");
      } else {
        toast.error(response.data.error || "Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Cancellation error:", error);
      toast.error("An error occurred while cancelling the subscription");
    }
  };

  return (
    <div className="min-h-[calc(100vh-69px)] w-full flex flex-col py-8 items-center bg-primary1/10">
      <h1 className="text-2xl font-medium mb-8 text-primary1">Membership</h1>

      {isLoading ? (
        <div className="text-center">Loading subscription details...</div>
      ) : (
        <>
          {subscription && renderSubscriptionDetails()}

          {subscription && subscription.status === "ACTIVE" && (
            <div className="mb-8">
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                className="bg-red-500 hover:bg-red-600"
              >
                Cancel Subscription
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {demoPlanes.map((plane, index) => (
              <MembershipCard key={index} plane={plane} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MembershipPage;
