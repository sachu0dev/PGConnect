import { redirect } from "next/navigation";

/** Legacy URL (/verify/<username>) — verification is now keyed by email at /verify. */
export default function LegacyVerifyPage() {
  redirect("/verify");
}
