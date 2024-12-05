"use client";

import { Check, IndianRupee } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface MembershipCardProps {
  title: string;
  price: number;
  features: string[];
  link: string;
}

const MembershipCard = ({ plane }: { plane: MembershipCardProps }) => {
  const handleClick = () => {
    toast.success("Feature coming soon...");
  };

  return (
    <div className="p-4 w-[400px] bg-primary1 rounded-xl flex flex-col justify-between gap-4 text-white">
      <div>
        <h3 className="text-lg font-medium text-center mb-4 ">{plane.title}</h3>
        <h1 className="flex items-center text-3xl font-bold">
          <IndianRupee />
          {plane.price === 0 ? "Free" : plane.price}
        </h1>
        <span className="text-xs">monthly payment</span>
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
          onClick={handleClick}
          className="bg-white text-primary1 w-full rounded-full hover:bg-white mb-2"
        >
          Get this plan
        </Button>
        <div className="w-full text-xs text-center">
          <div>Payment secured by PhonePay</div>
        </div>
      </div>
    </div>
  );
};

export default MembershipCard;
