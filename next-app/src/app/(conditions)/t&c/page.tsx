import type { Metadata } from "next";
import Link from "next/link";
import { Callout } from "@/components/legal/prose";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "The rules for using PGConnect to find, list and enquire about PGs and co-living spaces in India, including owner obligations, subscriptions and our role as an intermediary.",
  alternates: { canonical: "/terms" },
};

const mail = <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;

const sections: LegalSection[] = [
  {
    id: "about",
    title: "About these terms",
    body: (
      <>
        <p>
          These Terms of use (&ldquo;Terms&rdquo;) govern your access to and use of the {APP_NAME} website, apps and
          related services (together, the &ldquo;Platform&rdquo;), operated by {APP_NAME} (&ldquo;we&rdquo;,
          &ldquo;us&rdquo;, &ldquo;our&rdquo;). By creating an account, posting a listing or otherwise using the
          Platform you agree to these Terms and to our <Link href="/privacy">Privacy policy</Link>. If you do not
          agree, please do not use the Platform.
        </p>
        <p>
          You must be at least 18 years old and capable of entering into a binding contract under the Indian Contract
          Act, 1872 to create an account. If you use the Platform on behalf of a business, you confirm that you are
          authorised to accept these Terms for it.
        </p>
      </>
    ),
  },
  {
    id: "intermediary",
    title: "Our role: an online intermediary",
    body: (
      <>
        <p>
          {APP_NAME} is an online marketplace that helps people looking for paying-guest (PG), hostel and co-living
          accommodation (&ldquo;Tenants&rdquo;) discover and contact the people who run them (&ldquo;Owners&rdquo;).
          We are an <strong>intermediary</strong> within the meaning of Section 2(1)(w) of the Information Technology
          Act, 2000 and we follow the due-diligence requirements of the Information Technology (Intermediary
          Guidelines and Digital Media Ethics Code) Rules, 2021.
        </p>
        <ul>
          <li>
            We do not own, manage, inspect or operate any property listed on the Platform, and we are{" "}
            <strong>not a party</strong> to any rental, licence, leave-and-licence or PG agreement between a Tenant
            and an Owner.
          </li>
          <li>
            We do not collect rent, deposits, token amounts or brokerage on behalf of Owners. Any such payment is a
            matter strictly between the Tenant and the Owner.
          </li>
          <li>
            Listing content (photos, prices, amenities, availability, rules) is provided by Owners. A &ldquo;Verified
            Owner&rdquo; badge only means we reviewed an identity document submitted by that Owner; it is not a
            guarantee of the property, its condition or the Owner&rsquo;s conduct.
          </li>
        </ul>
        <Callout title="Stay safe">
          <p>
            Always visit a PG in person and check the room, agreement and the Owner&rsquo;s identity before paying
            anything. Never pay a &ldquo;token&rdquo; or advance to hold a room you have not seen. Report suspicious
            listings using the <strong>Report</strong> button on the listing page.
          </p>
        </Callout>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Your account",
    body: (
      <ul>
        <li>Provide accurate information and keep your email address and phone number up to date.</li>
        <li>
          Keep your password and one-time codes (OTPs) confidential. You are responsible for activity on your
          account; tell us immediately at {mail} if you suspect unauthorised access.
        </li>
        <li>One person may hold only one account. Accounts are personal and may not be sold or transferred.</li>
        <li>
          You can delete your account at any time from <Link href="/account">Account settings</Link>.
        </li>
      </ul>
    ),
  },
  {
    id: "tenants",
    title: "Using the Platform as a Tenant",
    body: (
      <ul>
        <li>
          Use the Platform only to look for accommodation for yourself or someone you are genuinely helping (for
          example, a family member).
        </li>
        <li>
          When you request a callback or a visit, the name and phone number you enter are shared with that Owner so
          they can contact you. Only request contact when you are actually interested.
        </li>
        <li>
          Reviews must reflect your own genuine experience of the PG. Do not post fake, paid or retaliatory reviews.
        </li>
        <li>Do not use Owner phone numbers or chat for marketing, spam or any purpose other than your enquiry.</li>
      </ul>
    ),
  },
  {
    id: "owners",
    title: "Owner obligations and listing accuracy",
    body: (
      <>
        <p>If you list a property, you confirm and agree that:</p>
        <ul>
          <li>
            You own the property or are legally authorised by its owner to offer it on a paying-guest or co-living
            basis, and doing so complies with applicable laws, society rules and any licences or registrations
            required by your local authority.
          </li>
          <li>
            Every listing is accurate and current: real photos of the actual property, the true monthly rent,
            security deposit, food arrangement, sharing options, notice period, house rules and availability. Mark a
            listing as paused when you have no beds available.
          </li>
          <li>
            You will not advertise one price and charge another, add undisclosed mandatory charges, or ask Tenants to
            pay before they have visited the property.
          </li>
          <li>
            You will respond to Tenant enquiries in good faith, treat Tenants without discrimination prohibited by
            law, and use their contact details only to respond to their enquiry.
          </li>
          <li>
            You are solely responsible for your agreement with each Tenant, for collecting and refunding rent and
            deposits, and for complying with tenancy, police-verification, tax and safety obligations.
          </li>
        </ul>
        <p>
          You grant {APP_NAME} a non-exclusive, royalty-free, worldwide licence to host, display, reproduce, resize and
          promote your listing content (including on our social media and search engines) for as long as the listing
          is on the Platform.
        </p>
      </>
    ),
  },
  {
    id: "prohibited",
    title: "Prohibited content and conduct",
    body: (
      <>
        <p>You must not upload, post or share anything that:</p>
        <ul>
          <li>is false, misleading or fraudulent, including fake listings, stock photos passed off as real, or bait pricing;</li>
          <li>belongs to someone else and you have no right to share it (copyright, trademarks, personal data);</li>
          <li>
            is obscene, defamatory, harassing, hateful, or discriminates on the basis of religion, caste, race,
            ethnicity or region, or is otherwise unlawful;
          </li>
          <li>threatens the unity, integrity, security or public order of India, or is harmful to children;</li>
          <li>contains viruses or malicious code, or attempts to scrape, overload or break into the Platform;</li>
          <li>impersonates another person or misrepresents your relationship with a property or business;</li>
          <li>promotes brokerage-for-hire, unrelated advertising or spam.</li>
        </ul>
      </>
    ),
  },
  {
    id: "moderation",
    title: "Moderation, takedown and suspension",
    body: (
      <>
        <p>
          We may review, edit for formatting, hide, block or remove any listing, review or message, and suspend or
          terminate any account, if we reasonably believe it violates these Terms or the law, puts users at risk, or
          if we are required to do so by a court or government order. Where practical we will tell you why.
        </p>
        <p>
          <strong>Reporting and takedown:</strong> anyone can report a listing from its page, or write to us at{" "}
          {mail}. Complaints under the IT Rules, 2021 can also be sent to our Grievance Officer (see the{" "}
          <Link href="/privacy#grievance">Privacy policy</Link>). We acknowledge complaints within 24 hours and aim to
          resolve them within 15 days; content that is clearly unlawful is acted on faster as required by law.
        </p>
        <p>
          If your account or listing was actioned and you believe this was a mistake, reply to our email or contact
          {" "}{mail} and we will review the decision.
        </p>
      </>
    ),
  },
  {
    id: "subscriptions",
    title: "Owner plans and payments",
    body: (
      <>
        <p>
          Listing a PG is free on the Starter plan. Owners can buy paid monthly plans that unlock more active
          listings and better placement, as described on our <Link href="/membership">Plans page</Link>. Prices are
          in Indian Rupees (₹), and any applicable taxes are shown before you pay.
        </p>
        <ul>
          <li>
            Paid plans are recurring subscriptions billed in advance each month through our payment partner,
            Razorpay. By subscribing you authorise these recurring charges until you cancel.
          </li>
          <li>
            You can cancel at any time from the Plans page; cancellation stops future renewals and your plan stays
            active until the end of the period you have paid for. Refunds are governed by our{" "}
            <Link href="/refund-policy">Cancellation &amp; refunds policy</Link>.
          </li>
          <li>
            If a renewal payment fails, your account may move back to the free plan and listings above the free limit
            may be paused until payment succeeds.
          </li>
          <li>
            A paid plan improves visibility only. It does not guarantee any number of enquiries, tenants or bookings.
          </li>
          <li>We may change plan prices or features with at least 30 days&rsquo; notice for existing subscribers.</li>
        </ul>
      </>
    ),
  },
  {
    id: "ip",
    title: "Our content and intellectual property",
    body: (
      <p>
        The Platform&rsquo;s software, design, logo, the {APP_NAME} name and all content we create belong to us or
        our licensors. You may use the Platform for its intended personal, non-commercial purpose. You may not copy,
        scrape, frame or resell listings or other data from the Platform without our written permission.
      </p>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: (
      <p>
        The Platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the maximum extent
        permitted by law, we do not warrant that listings are accurate, complete or available, that any Owner or
        Tenant is who they claim to be or will behave appropriately, or that the Platform will be uninterrupted or
        error-free. Map locations and distances are approximate.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <>
        <p>
          To the maximum extent permitted by law, {APP_NAME} will not be liable for any indirect, incidental, special
          or consequential loss, or for any loss arising out of dealings, agreements, payments, disputes, injury or
          damage between Tenants and Owners or relating to any property listed on the Platform.
        </p>
        <p>
          Our total aggregate liability to you for any claim relating to the Platform is limited to the greater of
          (a) the amount you paid us for subscriptions in the three months before the claim arose, and (b) ₹1,000.
          Nothing in these Terms limits liability that cannot be limited under applicable law.
        </p>
        <p>
          You agree to indemnify {APP_NAME} against claims, penalties and costs arising out of your listings, your
          content, your breach of these Terms or your violation of any law or third-party right.
        </p>
      </>
    ),
  },
  {
    id: "law",
    title: "Governing law and disputes",
    body: (
      <p>
        These Terms are governed by the laws of India. Please contact us first at {mail} so we can try to resolve any
        concern informally. Subject to that, the courts at the place of our registered office shall have exclusive
        jurisdiction over any dispute arising out of these Terms or the Platform.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes and contact",
    body: (
      <p>
        We may update these Terms from time to time. For material changes we will notify registered users by email
        or on the Platform before they take effect; continuing to use the Platform after that means you accept the
        updated Terms. Questions? Write to {mail} or use our <Link href="/contact">Contact page</Link>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      intro={
        <p>
          The short version: {APP_NAME} connects tenants with PG owners. We don&rsquo;t charge tenants, we don&rsquo;t
          take brokerage, and we aren&rsquo;t a party to your rental agreement. Owners must list honestly, and
          everyone must treat each other fairly.
        </p>
      }
      sections={sections}
    />
  );
}
