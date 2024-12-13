import React from "react";

const ContactUs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 sm:p-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">
        Contact Us
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Last updated on Dec 13, 2024
      </p>
      <div className="space-y-6 text-gray-700 dark:text-gray-300">
        <p>You may contact us using the information below:</p>
        <ul className="list-none space-y-3">
          <li>
            <strong>Merchant Legal Entity Name:</strong> SUSHIL KUMAR
          </li>
          <li>
            <strong>Registered Address:</strong> Shahpurkandi, Pathankot,
            Punjab, Pathankot, PUNJAB 145029
          </li>
          <li>
            <strong>Telephone No:</strong> 6283816638
          </li>
          <li>
            <strong>Email ID:</strong>{" "}
            <a
              href="mailto:contact@pgconnect.site"
              className="text-blue-500 hover:underline"
            >
              contact@pgconnect.site
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ContactUs;
