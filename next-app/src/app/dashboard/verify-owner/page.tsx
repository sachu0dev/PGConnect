import type { Metadata } from "next";
import { VerificationView } from "@/components/owner/verification-view";

export const metadata: Metadata = { title: "Owner verification", robots: { index: false, follow: false } };

export default function VerifyOwnerPage() {
  return <VerificationView />;
}
