import React from "react";

const ShippingAndDelivery: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">
        Shipping and Delivery
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Last updated on Dec 13, 2024
      </p>
      <div className="space-y-6 text-gray-700 dark:text-gray-300">
        <p>Shipping is not applicable for business.</p>
      </div>
    </div>
  );
};

export default ShippingAndDelivery;
