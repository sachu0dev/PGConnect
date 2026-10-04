import type { Metadata } from "next";
import Link from "next/link";
import { Callout } from "@/components/legal/prose";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Cancellation & refunds",
  description:
    "How to cancel a PGConnect owner plan, what happens when you cancel, and when you are eligible for a refund.",
  alternates: { canonical: "/refund-policy" },
};

const mail = <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;

const sections: LegalSection[] = [
  {
    id: "applies",
    title: "What this policy covers",
    body: (
      <p>
        Searching for PGs, chatting with owners and sending callback or visit requests are free for tenants, so there
        is nothing to cancel or refund. This policy applies to the paid monthly plans that owners buy on our{" "}
        <Link href="/membership">Plans page</Link>, which are billed through Razorpay. {APP_NAME} does not collect
        rent, deposits or token amounts — refunds of those are between the tenant and the owner.
      </p>
    ),
  },
  {
    id: "cancel",
    title: "Cancelling your plan",
    body: (
      <ul>
        <li>
          You can cancel at any time from the <Link href="/membership">Plans page</Link> while signed in. No phone call
          or email is needed.
        </li>
        <li>
          Cancellation <strong>stops all future renewals</strong>. You will not be charged again after cancelling.
        </li>
        <li>
          Your plan benefits stay active until the end of the billing period you have already paid for. After that
          your account moves to the free Starter plan; listings above the free limit are paused, not deleted, and you
          can re-activate them by upgrading again.
        </li>
      </ul>
    ),
  },
  {
    id: "refunds",
    title: "When we refund",
    body: (
      <>
        <p>We issue a full refund of the affected amount in these cases:</p>
        <ul>
          <li>
            <strong>Duplicate charge</strong> — you were charged more than once for the same plan and period.
          </li>
          <li>
            <strong>Failed or incomplete transaction</strong> — money was debited but the plan was not activated on your
            account.
          </li>
          <li>
            <strong>Charged after cancelling</strong> — a renewal went through after you had cancelled before the
            renewal date.
          </li>
        </ul>
        <p>
          Refunds are initiated within <strong>7 business days</strong> of confirming the issue and are credited to the
          original payment method. Depending on your bank or card issuer, it can take a further 5–10 business days to
          show up in your account.
        </p>
      </>
    ),
  },
  {
    id: "no-refunds",
    title: "When we don't refund",
    body: (
      <>
        <p>
          Apart from the cases above, plan payments are <strong>non-refundable</strong>, and we do not give pro-rated
          refunds for partially used months — for example, if you cancel halfway through a billing period or pause your
          listings because your PG is full. You keep the plan benefits until the period ends.
        </p>
        <p>
          A paid plan improves the visibility of your listings; it does not guarantee a specific number of enquiries or
          tenants, so a low number of leads is not a ground for a refund.
        </p>
      </>
    ),
  },
  {
    id: "request",
    title: "How to request a refund",
    body: (
      <>
        <p>
          Email {mail} from your registered email address within 30 days of the charge with your registered email, the
          date and amount of the charge, and the Razorpay payment ID (from your payment confirmation email or SMS), if
          available.
        </p>
        <Callout>
          <p>
            We reply within 2 business days. If the charge qualifies, we confirm the refund and initiate it within 7
            business days.
          </p>
        </Callout>
      </>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Cancellation & refunds"
      intro={
        <p>
          Cancel your owner plan anytime in two clicks. Charged twice or charged for a plan that never activated?
          We&rsquo;ll refund you.
        </p>
      }
      sections={sections}
    />
  );
}
