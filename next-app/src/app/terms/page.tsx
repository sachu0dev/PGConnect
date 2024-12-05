import React from "react";

const Page = () => {
  return (
    <div>
      <div className="bg-gray-950 text-white  p-6 sm:p-10 font-sans">
        <h1 className="text-3xl font-bold text-center  mb-6">
          Terms and Conditions for PGConnect
        </h1>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-base">
            Welcome to PGConnect, an online platform designed to connect Paying
            Guest (PG) seekers with PG owners. By using our website, you agree
            to these Terms and Conditions.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">2. Membership Tiers</h2>
          <p className="text-base mb-4">
            PGConnect offers three distinct membership tiers for PG owners:
          </p>

          <div className="ml-4">
            <h3 className="text-lg font-medium mb-2">2.1 Free Tier</h3>
            <ul className="list-disc list-inside">
              <li>Maximum of 1 PG listing</li>
              <li>Limited management access</li>
              <li>Basic ability to edit PG details</li>
              <li>No additional features</li>
            </ul>
          </div>

          <div className="ml-4 mt-4">
            <h3 className="text-lg font-medium mb-2">2.2 Pro Tier</h3>
            <ul className="list-disc list-inside">
              <li>Maximum of 5 PG listings</li>
              <li>
                Callback request feature:
                <ul className="list-disc list-inside ml-6">
                  <li>Users can request callbacks</li>
                  <li>Callback requests visible in PG owner dashboard</li>
                  <li>
                    Callback details sent to PG owner&apos;s registered email
                  </li>
                </ul>
              </li>
              <li>No advertising capabilities</li>
            </ul>
          </div>

          <div className="ml-4 mt-4">
            <h3 className="text-lg font-medium  mb-2">2.3 Premium Tier</h3>
            <ul className="list-disc list-inside">
              <li>Maximum of 20 PG listings</li>
              <li>
                All features of Pro Tier, including callback request
                functionality
              </li>
              <li>
                Advertising feature:
                <ul className="list-disc list-inside ml-6">
                  <li>Ability to run advertisements</li>
                  <li>
                    Option to showcase PG listings in top section of city
                    listings
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold  mb-4">
            3. Platform Description
          </h2>
          <p className="text-base">
            PGConnect is a digital marketplace that facilitates the discovery of
            Paying Guest accommodations. We provide a platform for:
          </p>
          <ul className="list-disc list-inside ml-4">
            <li>
              PG seekers to browse and connect with potential accommodations
            </li>
            <li>
              PG owners to list their properties and manage their listings
              through different membership tiers
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold  mb-4">
            4. User Roles and Responsibilities
          </h2>

          <div className="ml-4">
            <h3 className="text-lg font-medium  mb-2">4.1 PG Seekers</h3>
            <ul className="list-disc list-inside">
              <li>Can browse listings free of charge</li>
              <li>Must provide accurate personal information during signup</li>
              <li>
                Responsible for all interactions and agreements made outside the
                platform
              </li>
            </ul>
          </div>

          <div className="ml-4 mt-4">
            <h3 className="text-lg font-medium  mb-2">4.2 PG Owners</h3>
            <ul className="list-disc list-inside">
              <li>
                Can choose membership tier based on their listing and feature
                requirements
              </li>
              <li>Responsible for accurate and current property information</li>
              <li>
                Must comply with platform guidelines specific to their chosen
                tier
              </li>
            </ul>
          </div>
        </section>

        <section className="text-center mt-10">
          <p className="text-sm text-gray-600">
            **Last Updated: [5, 12, 2024]**
          </p>
          <p className="text-sm text-gray-600">
            By using PGConnect, you acknowledge that you have read, understood,
            and agree to these Terms and Conditions.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Page;
