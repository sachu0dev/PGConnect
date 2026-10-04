import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Service delivery policy",
  description:
    "PGConnect plans are a digital service activated instantly after payment. There is no physical shipping.",
  alternates: { canonical: "/shipping-policy" },
};

const sections: LegalSection[] = [
  {
    id: "digital",
    title: "A digital service — no shipping",
    body: (
      <p>
        {APP_NAME} sells only online subscription plans for property owners. There are no physical goods, so nothing
        is shipped or couriered and no delivery charges apply.
      </p>
    ),
  },
  {
    id: "activation",
    title: "When your plan is activated",
    body: (
      <>
        <p>
          Your plan is activated on your account <strong>immediately after Razorpay confirms the payment</strong> —
          usually within a few seconds. You will see the new plan on the <Link href="/membership">Plans page</Link> and
          in your owner dashboard, and the higher listing limit applies straight away.
        </p>
        <p>
          In rare cases (for example, a delayed confirmation from your bank) activation can take up to 30 minutes.
          Renewals are applied automatically at the start of each billing period.
        </p>
      </>
    ),
  },
  {
    id: "issues",
    title: "If your plan isn't active",
    body: (
      <p>
        If money was debited but your plan is not active after 30 minutes, email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your registered email and payment ID. We will
        activate the plan or refund you as described in our{" "}
        <Link href="/refund-policy">Cancellation &amp; refunds policy</Link>.
      </p>
    ),
  },
];

export default function ShippingPolicyPage() {
  return <LegalPage title="Service delivery policy" sections={sections} />;
}
