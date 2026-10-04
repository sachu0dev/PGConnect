import { BadgeCheck, Ban, Clock3, Crown, PauseCircle, PlayCircle, ShieldAlert, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PLANS, type PlanId } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PlanBadge({ plan, className }: { plan: PlanId; className?: string }) {
  return (
    <Badge
      variant={plan === "FREE" ? "muted" : "default"}
      className={cn(plan === "PREMIUM" && "bg-amber-400 text-amber-950", className)}
    >
      {plan !== "FREE" ? <Crown /> : null}
      {PLANS[plan].name} plan
    </Badge>
  );
}

export function VerificationBadge({
  status,
  className,
}: {
  status: "PENDING" | "APPROVED" | "REJECTED" | null;
  className?: string;
}) {
  if (status === "APPROVED") {
    return (
      <Badge variant="success" className={className}>
        <BadgeCheck /> Verified owner
      </Badge>
    );
  }
  if (status === "PENDING") {
    return (
      <Badge variant="warning" className={className}>
        <Clock3 /> Verification in review
      </Badge>
    );
  }
  if (status === "REJECTED") {
    return (
      <Badge variant="destructive" className={className}>
        <ShieldAlert /> Verification needs attention
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={className}>
      <ShieldQuestion /> Not verified
    </Badge>
  );
}

export function ListingStatusPill({
  status,
  className,
}: {
  status: "ACTIVE" | "PAUSED" | "BLOCKED";
  className?: string;
}) {
  if (status === "ACTIVE") {
    return (
      <Badge variant="success" className={className}>
        <PlayCircle /> Live
      </Badge>
    );
  }
  if (status === "PAUSED") {
    return (
      <Badge variant="warning" className={className}>
        <PauseCircle /> Paused
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className={className}>
      <Ban /> Blocked
    </Badge>
  );
}

export const LEAD_STATUS_LABEL = { NEW: "New", CONTACTED: "Contacted", CLOSED: "Closed" } as const;

export function LeadStatusBadge({ status }: { status: "NEW" | "CONTACTED" | "CLOSED" }) {
  return (
    <Badge variant={status === "NEW" ? "default" : status === "CONTACTED" ? "secondary" : "muted"}>
      {LEAD_STATUS_LABEL[status]}
    </Badge>
  );
}
