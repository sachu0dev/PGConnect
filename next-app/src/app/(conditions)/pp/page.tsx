import type { Metadata } from "next";
import Link from "next/link";
import { Callout } from "@/components/legal/prose";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How PGConnect collects, uses, shares and protects your personal data under India's Digital Personal Data Protection Act, 2023 — and how to exercise your rights.",
  alternates: { canonical: "/privacy" },
};

const mail = <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;

const sections: LegalSection[] = [
  {
    id: "scope",
    title: "Who we are and what this covers",
    body: (
      <>
        <p>
          {APP_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) runs an online marketplace that connects people looking for
          PG and co-living accommodation in India with property owners. For the personal data described here we are
          the <strong>Data Fiduciary</strong> under the Digital Personal Data Protection Act, 2023 (&ldquo;DPDP
          Act&rdquo;).
        </p>
        <p>
          This policy applies to our website, apps and services (the &ldquo;Platform&rdquo;). By using the Platform you
          give consent to the processing described below for the stated purposes. You can withdraw consent at any time
          (see <a href="#rights">Your rights</a>); withdrawal does not affect processing already done.
        </p>
      </>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <table>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Account</td>
            <td>
              Username, email address, password (stored only as a one-way hash), and your Google account ID and email
              if you sign in with Google.
            </td>
          </tr>
          <tr>
            <td>Phone number</td>
            <td>
              The mobile number you add to your profile, enter in a callback or visit request, or provide as a
              listing&rsquo;s contact number.
            </td>
          </tr>
          <tr>
            <td>Listing data (owners)</td>
            <td>
              PG name, address, locality, map location, photos, rent, deposit, amenities, rules and availability.
              Listing details are public by design.
            </td>
          </tr>
          <tr>
            <td>Enquiries and activity</td>
            <td>
              Callback and visit requests (name, phone, preferred date, message), shortlisted PGs, reviews and
              ratings, and reports you file about listings.
            </td>
          </tr>
          <tr>
            <td>Chat messages</td>
            <td>Messages you exchange with owners or tenants on the Platform, with read status and timestamps.</td>
          </tr>
          <tr>
            <td>Owner ID verification</td>
            <td>
              Your full name as on the document, the document type, <strong>only the last 4 characters</strong> of
              the document number, and an image or PDF of the document. The document is stored in private, encrypted
              storage that is never publicly accessible.
            </td>
          </tr>
          <tr>
            <td>Payments (owners)</td>
            <td>
              Plan, subscription and payment IDs, amounts and status received from Razorpay. We never see or store
              your full card, UPI PIN or bank credentials.
            </td>
          </tr>
          <tr>
            <td>Technical data</td>
            <td>
              Sign-in sessions (with your browser&rsquo;s user-agent), IP address used for security and rate limiting,
              and basic server logs.
            </td>
          </tr>
        </tbody>
      </table>
    ),
  },
  {
    id: "purposes",
    title: "Why we use it",
    body: (
      <ul>
        <li>To create and secure your account, verify your email with one-time codes and keep you signed in.</li>
        <li>To show listings, search results and maps, and to let tenants and owners contact each other.</li>
        <li>To deliver enquiries and chat messages, and to email you about new leads, messages and account events.</li>
        <li>To verify owners and display the &ldquo;Verified Owner&rdquo; badge.</li>
        <li>To process owner subscriptions, renewals, cancellations and refunds.</li>
        <li>
          To keep the Platform safe: detect fake listings, spam and fraud, act on reports, enforce our{" "}
          <Link href="/terms">Terms</Link> and comply with law-enforcement requests that are valid under Indian law.
        </li>
        <li>To understand aggregate usage and improve the Platform.</li>
      </ul>
    ),
  },
  {
    id: "sharing",
    title: "Who can see your data",
    body: (
      <>
        <ul>
          <li>
            <strong>Owners</strong> see the name and phone number you submit in a callback or visit request, along
            with your message and preferred visit date, and the messages you send them in chat.
          </li>
          <li>
            <strong>Tenants</strong> see an owner&rsquo;s listing contact number when they choose to reveal it while
            signed in, and the owner&rsquo;s username in chat.
          </li>
          <li>
            <strong>Everyone</strong> can see public listing details and the username, rating and text of reviews.
          </li>
          <li>
            <strong>Our moderation team</strong> can access reports and, for owner verification only, the ID document
            you upload.
          </li>
        </ul>
        <p>
          We do not sell your personal data. We may disclose data when required by law, court order or a lawful request
          from a government agency, or to protect the rights and safety of our users.
        </p>
      </>
    ),
  },
  {
    id: "processors",
    title: "Service providers (Data Processors)",
    body: (
      <>
        <p>
          We use trusted providers who process data on our behalf under contract and only for the purposes above:
        </p>
        <ul>
          <li>
            <strong>Hosting and database</strong> — cloud hosting for our web application, database and realtime chat
            server.
          </li>
          <li>
            <strong>Amazon Web Services (AWS)</strong> — storage of listing photos (public) and ID documents (private,
            encrypted).
          </li>
          <li>
            <strong>Resend</strong> — sending transactional emails such as sign-in codes and lead alerts.
          </li>
          <li>
            <strong>Razorpay</strong> — payment processing for owner plans, under its own privacy policy and RBI
            regulations.
          </li>
          <li>
            <strong>Google</strong> — optional &ldquo;Sign in with Google&rdquo; and maps/place search.
          </li>
        </ul>
        <p>Some providers may process data outside India, subject to safeguards and any restrictions notified under the DPDP Act.</p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <p>
        We use a single <strong>essential cookie</strong>: an http-only, secure sign-in cookie that keeps you logged
        in. We do not use advertising or cross-site tracking cookies. Your light/dark theme choice is saved in your
        browser&rsquo;s local storage and never sent to us.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <ul>
        <li>Account, listing, enquiry, chat and review data: for as long as your account is active.</li>
        <li>
          <strong>ID verification documents:</strong> kept only for review and fraud prevention, and deleted within{" "}
          <strong>90 days</strong> after we approve or reject the request. The decision, name, document type and last
          4 characters are kept while you remain a verified owner.
        </li>
        <li>Expired sign-in sessions and one-time codes: deleted or invalidated automatically.</li>
        <li>
          After you delete your account, your profile, listings, shortlist, enquiries, chats and reviews are removed
          from the Platform. We may keep limited records where the law requires it (for example, payment and tax
          records) or to resolve an open dispute, and backups are overwritten in the normal cycle.
        </li>
      </ul>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>Under the DPDP Act you have the right to:</p>
        <ul>
          <li>
            <strong>Access</strong> a summary of the personal data we hold about you and how it is processed.
          </li>
          <li>
            <strong>Correction and updating</strong> — edit your username and phone number in{" "}
            <Link href="/account">Account settings</Link>, and your listings from the owner dashboard.
          </li>
          <li>
            <strong>Erasure</strong> — delete your account yourself at any time from{" "}
            <Link href="/account">Account settings</Link>, or ask us to erase specific data.
          </li>
          <li>
            <strong>Withdraw consent</strong> to processing that relies on consent.
          </li>
          <li>
            <strong>Grievance redressal</strong> and to <strong>nominate</strong> another person to exercise your
            rights in the event of death or incapacity.
          </li>
        </ul>
        <p>
          To exercise a right, email {mail} from your registered email address. We may need to verify your identity
          and will respond within the timelines set by law. If you are not satisfied with our response you may
          complain to the Data Protection Board of India.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We use HTTPS everywhere, hash passwords, keep sign-in tokens short-lived, store ID documents in private
        encrypted storage accessible only through short-lived links to authorised staff, and limit repeated
        attempts on sensitive actions. No system is perfectly secure; if we become aware of a personal data breach
        we will notify affected users and the Data Protection Board as required by law.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        The Platform is meant for users aged 18 and above. We do not knowingly process data of children. If you
        believe a child has created an account, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "grievance",
    title: "Grievance Officer",
    body: (
      <>
        <p>
          In line with the DPDP Act and the Information Technology (Intermediary Guidelines and Digital Media Ethics
          Code) Rules, 2021, you can reach our Grievance Officer for any privacy concern or complaint about content on
          the Platform:
        </p>
        <Callout>
          <p>
            <strong>Grievance Officer, {APP_NAME}</strong>
            <br />
            Email: {mail} (subject line: &ldquo;Grievance&rdquo;)
          </p>
          <p>We acknowledge grievances within 24 hours and aim to resolve them within 15 days.</p>
        </Callout>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We will post any changes on this page and update the date above. If the changes are significant we will also
        notify you by email or on the Platform before they take effect.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro={
        <p>
          We collect only what we need to help you find or fill a PG, we never sell your data, and your phone number
          is shared with an owner only when you ask them to contact you.
        </p>
      }
      sections={sections}
    />
  );
}
