import React from "react";

const CancellationAndRefund: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">
        Cancellation and Refund
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Last updated on Dec 13, 2024
      </p>
      <div className="space-y-6 text-gray-700 dark:text-gray-300">
        <p>
          SUSHIL KUMAR believes in helping its customers as far as possible, and
          has therefore a liberal cancellation policy. Under this policy:
        </p>
        <ul className="list-disc pl-5 space-y-3">
          <li>
            Cancellations will be considered only if the request is made within
            7 days of placing the order. However, the cancellation request may
            not be entertained if the orders have been communicated to the
            vendors/merchants and they have initiated the process of shipping
            them.
          </li>
          <li>
            SUSHIL KUMAR does not accept cancellation requests for perishable
            items like flowers, eatables etc. However, refund/replacement can be
            made if the customer establishes that the quality of product
            delivered is not good.
          </li>
          <li>
            In case of receipt of damaged or defective items please report the
            same to our Customer Service team. The request will, however, be
            entertained once the merchant has checked and determined the same at
            his own end. This should be reported within 7 days of receipt of the
            products.
          </li>
          <li>
            In case you feel that the product received is not as shown on the
            site or as per your expectations, you must bring it to the notice of
            our customer service within 7 days of receiving the product. The
            Customer Service Team after looking into your complaint will take an
            appropriate decision.
          </li>
          <li>
            In case of complaints regarding products that come with a warranty
            from manufacturers, please refer the issue to them.
          </li>
        </ul>
        <p>
          In case of any Refunds approved by the SUSHIL KUMAR, it’ll take 6-8
          days for the refund to be processed to the end customer.
        </p>
      </div>
    </div>
  );
};

export default CancellationAndRefund;
