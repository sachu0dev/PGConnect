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
            12. Refund and Cancellation policy
          </h2>
          <p>
            This refund and cancellation policy outlines how you can cancel or
            seek a refund for service that you have purchased through the
            Platform. Under this policy:
          </p>
          <ul className="list-disc ml-6">
            <li>
              Cancellations will only be considered if the request is made 10
              days of placing the order.
            </li>
            <li>
              Please report to our customer service team. The request would be
              entertained once the seller/ merchant listed on the Platform, has
              checked and determined the same at its own end. This should be
              reported within 10 days of receipt of services
            </li>
            <li>
              In case of any refunds approved by SUSHIL KUMAR, it will take 10
              days for the refund to be processed to you in your original
              payment method.
            </li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">13. Privacy Policy</h2>
          <h2 className="text-xl font-semibold mb-4">Introduction</h2>

          <p>
            This Privacy Policy describes how SUSHIL KUMAR and its affiliates
            (collectively SUSHIL KUMAR , we, our, us) collect, use, share,
            protect or otherwise process your information/ personal data through
            our website https://pgconnect.site/ (hereinafter referred to as
            Platform). Please note that you may be able to browse certain
            sections of the Platform without registering with us.We do not offer
            any product /service under this Platform outside India and your
            personal data will primarily be stored and processed in India. By
            visiting this Platform, providing your information or availing any
            product/service offered on the Platform, you expressly agree to be
            bound by the terms and conditions of this Privacy Policy, the Terms
            of Use and the applicable service/product terms and conditions, and
            agree to be governed by the laws of India including but not limited
            to the laws applicable to data protection and privacy. If you do not
            agree please do not use or access our Platform. Collection-We
            collect your personal data when you use our Platform, services or
            otherwise interact with us during the course of our relationship.and
            related information provided from time to time. Some of the
            information that we may collect includes but is not limited to
            personal data / information provided to us during
            sign-up/registering or using our Platform such as name, date of
            birth, address, telephone/mobile number, email IDand/or any such
            information shared as proof of identity or address. Some of the
            sensitive personal data may be collected with your consent, such as
            your bank account or credit or debit card or other payment
            instrument information or biometric information such as your facial
            features or physiological information (in order to enable use of
            certain features when opted for, available on the Platform) etc all
            of the above being in accordance with applicable law(s) You always
            have the option to not provide information, by choosing not to use a
            particular service or feature on the Platform. We may track your
            behaviour, preferences, and other information that you choose to
            provide on our Platform. This information is compiled and analysed
            on an aggregated basis. We will also collect your information
            related to your transactions on Platform and such third-party
            business partner platforms. When such a third-party business partner
            collects your personal data directly from you, you will be governed
            by their privacy policies. We shall not be responsible for the
            third-party business partner’s privacy practices or the content of
            their privacy policies, and we request you to read their privacy
            policies prior to disclosing any information. If you receive an
            email, a call from a person/association claiming to be SUSHIL KUMAR
            seeking any personal data like debit/credit card PIN, net-banking or
            mobile banking password, we request you to never provide such
            information. If you have already revealed such information, report
            it immediately to an appropriate law enforcement agency. Usage- We
            use personal data to provide the services you request. To the extent
            we use your personal data to market to you, we will provide you the
            ability to opt-out of such uses. We use your personal data to assist
            sellers and business partners in handling and fulfilling orders;
            enhancing customer experience; to resolve disputes; troubleshoot
            problems; inform you about online and offline offers, products,
            services, and updates; customise your experience; detect and protect
            us against error, fraud and other criminal activity; enforce our
            terms and conditions; conduct marketing research, analysis and
            surveys; and as otherwise described to you at the time of collection
            of information. You understand that your access to these
            products/services may be affected in the event permission is not
            provided to us. Sharing- We may share your personal data internally
            within our group entities, our other corporate entities, and
            affiliates to provide you access to the services and products
            offered by them. These entities and affiliates may market to you as
            a result of such sharing unless you explicitly opt-out. We may
            disclose personal data to third parties such as sellers, business
            partners, third party service providers including logistics
            partners, prepaid payment instrument issuers, third-party reward
            programs and other payment opted by you. These disclosure may be
            required for us to provide you access to our services and products
            offered to you, to comply with our legal obligations, to enforce our
            user agreement, to facilitate our marketing and advertising
            activities, to prevent, detect, mitigate, and investigate fraudulent
            or illegal activities related to our services. We may disclose
            personal and sensitive personal data to government agencies or other
            authorised law enforcement agencies if required to do so by law or
            in the good faith belief that such disclosure is reasonably
            necessary to respond to subpoenas, court orders, or other legal
            process. We may disclose personal data to law enforcement offices,
            third party rights owners, or others in the good faith belief that
            such disclosure is reasonably necessary to: enforce our Terms of Use
            or Privacy Policy; respond to claims that an advertisement, posting
            or other content violates the rights of a third party; or protect
            the rights, property or personal safety of our users or the general
            public. Security Precautions- To protect your personal data from
            unauthorised access or disclosure, loss or misuse we adopt
            reasonable security practices and procedures. Once your information
            is in our possession or whenever you access your account
            information, we adhere to our security guidelines to protect it
            against unauthorised access and offer the use of a secure server.
            However, the transmission of information is not completely secure
            for reasons beyond our control. By using the Platform, the users
            accept the security implications of data transmission over the
            internet and the World Wide Web which cannot always be guaranteed as
            completely secure, and therefore, there would always remain certain
            inherent risks regarding use of the Platform. Users are responsible
            for ensuring the protection of login and password records for their
            account. Data Deletion and Retention- You have an option to delete
            your account by visiting your profile and settings on our Platform ,
            this action would result in you losing all information related to
            your account. You may also write to us at the contact information
            provided below to assist you with these requests. We may in event of
            any pending grievance, claims, pending shipments or any other
            services we may refuse or delay deletion of the account. Once the
            account is deleted, you will lose access to the account. We retain
            your personal data information for a period no longer than is
            required for the purpose for which it was collected or as required
            under any applicable law. However, we may retain data related to you
            if we believe it may be necessary to prevent fraud or future abuse
            or for other legitimate purposes. We may continue to retain your
            data in anonymised form for analytical and research purposes. Your
            Rights- You may access, rectify, and update your personal data
            directly through the functionalities provided on the Platform.
            Consent- By visiting our Platform or by providing your information,
            you consent to the collection, use, storage, disclosure and
            otherwise processing of your information on the Platform in
            accordance with this Privacy Policy. If you disclose to us any
            personal data relating to other people, you represent that you have
            the authority to do so and permit us to use the information in
            accordance with this Privacy Policy. You, while providing your
            personal data over the Platform or any partner platforms or
            establishments, consent to us (including our other corporate
            entities, affiliates, lending partners, technology partners,
            marketing channels, business partners and other third parties) to
            contact you through SMS, instant messaging apps, call and/or e-mail
            for the purposes specified in this Privacy Policy. You have an
            option to withdraw your consent that you have already provided by
            writing to the Grievance Officer at the contact information provided
            below. Please mention “Withdrawal of consent for processing personal
            data” in your subject line of your communication. We may verify such
            requests before acting on our request. However, please note that
            your withdrawal of consent will not be retrospective and will be in
            accordance with the Terms of Use, this Privacy Policy, and
            applicable laws. In the event you withdraw consent given to us under
            this Privacy Policy, we reserve the right to restrict or deny the
            provision of our services for which we consider such information to
            be necessary. Changes to this Privacy Policy- Please check our
            Privacy Policy periodically for changes. We may update this Privacy
            Policy to reflect changes to our information practices. We may alert
            / notify you about the significant changes to the Privacy Policy, in
            the manner as may be required under applicable laws.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
          <p>
            These terms are governed by the laws of India, with exclusive
            jurisdiction in The Supreme Court.
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">
            15. Contact Information
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
