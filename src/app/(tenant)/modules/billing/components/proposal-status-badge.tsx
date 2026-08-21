import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProposalDisplayStatus } from "../types";

export const PROPOSAL_STATUS_CONFIG: Record<
  ProposalDisplayStatus,
  { label: string; tone: "green" | "amber" | "red" | "neutral" | "blue" }
> = {
  draft: { label: "Draft", tone: "neutral" },
  sent: { label: "Sent", tone: "blue" },
  accepted: { label: "Accepted", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
  expired: { label: "Expired", tone: "amber" },
};

export function ProposalStatusBadge({ status, className }: { status: ProposalDisplayStatus; className?: string }) {
  const { label, tone } = PROPOSAL_STATUS_CONFIG[status];
  return (
    <Badge tone={tone} className={cn(className)}>
      {label}
    </Badge>
  );
}
