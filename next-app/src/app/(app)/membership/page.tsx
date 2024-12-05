import MembershipCard from "@/components/specific/Membership";
import React from "react";
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
const page = () => {
  return (
    <div className="min-h-[calc(100vh-69px)] w-full flex flex-col py-8 items-center bg-primary1/10">
      <h1 className="text-2xl font-medium mb-8 text-primary1">Membership</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {demoPlanes.map((plane, index) => (
          <MembershipCard key={index} plane={plane} />
        ))}
      </div>
    </div>
  );
};

export default page;
