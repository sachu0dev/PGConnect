import { redirect } from "next/navigation";

export default function LegacyDashboardUserPage() {
  redirect("/account");
}
