import React from "react";

const Page = () => {
  return (
    <div className="bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-6">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            Terms and Conditions for PGConnect (pgconnect.site)
          </h1>
        </header>

        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Welcome to PGConnect, an online platform designed to connect Paying
            Guest (PG) seekers with PG owners. By using our website, you agree
            to these Terms and Conditions.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">2. Membership Tiers</h2>
          <p>PGConnect offers three distinct membership tiers for PG owners:</p>

          <h3 className="text-xl font-semibold mt-4 mb-2">2.1 Free Tier</h3>
          <ul className="list-disc ml-6">
            <li>Maximum of 1 PG listing</li>
            <li>Limited management access</li>
            <li>Basic ability to edit PG details</li>
            <li>No additional features</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4 mb-2">2.2 Pro Tier</h3>
          <ul className="list-disc ml-6">
            <li>Maximum of 5 PG listings</li>
            <li>
              Callback request feature
              <ul className="list-disc ml-6">
                <li>Users can request callbacks</li>
                <li>Callback requests visible in PG owner dashboard</li>
                <li>
                  Callback details sent to PG owner&apos;s registered email
                </li>
              </ul>
            </li>
            <li>No advertising capabilities</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4 mb-2">2.3 Premium Tier</h3>
          <ul className="list-disc ml-6">
            <li>Maximum of 20 PG listings</li>
            <li>
              All features of Pro Tier, including:
              <ul className="list-disc ml-6">
                <li>Callback request functionality</li>
              </ul>
            </li>
            <li>
              Advertising feature
              <ul className="list-disc ml-6">
                <li>Ability to run advertisements</li>
                <li>
                  Option to showcase PG listings in top section of city listings
                </li>
              </ul>
            </li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">
            3. Platform Description
          </h2>
          <p>
            PGConnect is a digital marketplace that facilitates the discovery of
            Paying Guest accommodations. We provide a platform for:
          </p>
          <ul className="list-disc ml-6">
            <li>
              PG seekers to browse and connect with potential accommodations
            </li>
            <li>
              PG owners to list their properties and manage their listings
              through different membership tiers
            </li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">
            4. User Roles and Responsibilities
          </h2>

          <h3 className="text-xl font-semibold mt-4 mb-2">4.1 PG Seekers</h3>
          <ul className="list-disc ml-6">
            <li>Can browse listings free of charge</li>
            <li>Must provide accurate personal information during signup</li>
            <li>
              Responsible for all interactions and agreements made outside the
              platform
            </li>
          </ul>

          <h3 className="text-xl font-semibold mt-4 mb-2">4.2 PG Owners</h3>
          <ul className="list-disc ml-6">
            <li>
              Can choose membership tier based on their listing and feature
              requirements
            </li>
            <li>Responsible for accurate and current property information</li>
            <li>
              Must comply with platform guidelines specific to their chosen tier
            </li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">
            5. Payment and Billing
          </h2>
          <ul className="list-disc ml-6">
            <li>Membership fees vary based on selected tier</li>
            <li>Fees are non-refundable except under specific circumstances</li>
            <li>
              Payments for memberships are processed through secure payment
              gateways
            </li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">6. Refund Policy</h2>

          <h3 className="text-xl font-semibold mt-4 mb-2">
            6.1 Refunds are eligible under the following conditions:
          </h3>
          <ul className="list-disc ml-6">
            <li>PG owner has made a membership payment</li>
            <li>Membership is not correctly updated in the platform</li>
            <li>User has reported an issue</li>
            <li>Platform fails to resolve the issue within 3 business days</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4 mb-2">
            6.2 Refund Process:
          </h3>
          <ul className="list-disc ml-6">
            <li>Refund requests must be submitted in writing</li>
            <li>Refunds will be processed within 7-10 business days</li>
            <li>Refund method will match the original payment method</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">
            7. User Data and Privacy
          </h2>

          <h3 className="text-xl font-semibold mt-4 mb-2">
            7.1 Collected Information
          </h3>
          <ul className="list-disc ml-6">
            <li>Full Name</li>
            <li>Phone Number</li>
            <li>Email Address</li>
          </ul>

          <h3 className="text-xl font-semibold mt-4 mb-2">
            7.2 Data Protection
          </h3>
          <ul className="list-disc ml-6">
            <li>We are committed to protecting user privacy</li>
            <li>Personal information will not be disclosed to third parties</li>
            <li>
              Data is stored securely and used only for platform-related
              communications
            </li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">
            8. Limitation of Liability
          </h2>

          <h3 className="text-xl font-semibold mt-4 mb-2">
            8.1 Platform Scope
          </h3>
          <ul className="list-disc ml-6">
            <li>PGConnect is a connection platform only</li>
            <li>We do not participate in actual rental agreements</li>
            <li>
              All transactions and agreements between PG seekers and owners are
              their sole responsibility
            </li>
          </ul>

          <h3 className="text-xl font-semibold mt-4 mb-2">8.2 Disclaimers</h3>
          <ul className="list-disc ml-6">
            <li>We do not guarantee the accuracy of listings</li>
            <li>Users must conduct their own due diligence</li>
            <li>
              PGConnect is not liable for:
              <ul className="list-disc ml-6">
                <li>Disputes between users</li>
                <li>Financial transactions</li>
                <li>Quality of accommodations</li>
                <li>Personal safety during interactions</li>
              </ul>
            </li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">9. User Conduct</h2>
          <ul className="list-disc ml-6">
            <li>Provide accurate information</li>
            <li>Not misuse the platform</li>
            <li>Respect other users&apos; privacy</li>
            <li>Comply with local laws and regulations</li>
            <li>
              Adhere to listing limits and features of their chosen membership
              tier
            </li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">
            10. Termination of Service
          </h2>

          <h3 className="text-xl font-semibold mt-4 mb-2">
            10.1 We reserve the right to:
          </h3>
          <ul className="list-disc ml-6">
            <li>Suspend or terminate user accounts</li>
            <li>Modify or discontinue platform services</li>
            <li>Refuse service to anyone without prior notice</li>
            <li>Enforce membership tier restrictions</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
          <p>
            We may modify these terms at any time. Changes will be communicated
            to users, and continued use of the platform will constitute
            acceptance of those changes.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">
            12. Contact Information
          </h2>
          <p>
            If you have any questions or concerns about these Terms and
            Conditions, please contact us at:
          </p>
          <ul className="list-disc ml-6">
            <li>
              Email:{" "}
              <a href="mailto:support@pgconnect.site" className="text-blue-400">
                support@pgconnect.site
              </a>
            </li>
          </ul>
        </section>

        <p className="text-center mt-8">**Last Updated:** 5,12,2024</p>
        <p className="text-center">
          **By using PGConnect, you acknowledge that you have read, understood,
          and agree to these Terms and Conditions.**
        </p>
      </div>
    </div>
  );
};

export default Page;
