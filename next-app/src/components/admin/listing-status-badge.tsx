import { Badge } from "@/components/ui/badge";

export function ListingStatusBadge({ status }: { status: "ACTIVE" | "PAUSED" | "BLOCKED" }) {
  if (status === "ACTIVE") return <Badge variant="success">Active</Badge>;
  if (status === "PAUSED") return <Badge variant="muted">Paused</Badge>;
  return <Badge variant="destructive">Blocked</Badge>;
}
