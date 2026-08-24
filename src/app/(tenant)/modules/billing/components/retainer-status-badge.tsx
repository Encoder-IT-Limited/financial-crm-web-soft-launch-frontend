import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RetainerDisplayStatus } from "../types";

const STATUS_CONFIG: Record<RetainerDisplayStatus, { label: string; tone: "green" | "amber" | "neutral" | "red" }> = {
  active: { label: "Active", tone: "green" },
  paused: { label: "Paused", tone: "amber" },
  closed: { label: "Closed", tone: "neutral" },
  expired: { label: "Expired", tone: "red" },
};

export function RetainerStatusBadge({ status, className }: { status: RetainerDisplayStatus; className?: string }) {
  const { label, tone } = STATUS_CONFIG[status];
  return (
    <Badge tone={tone} className={cn(className)}>
      {label}
    </Badge>
  );
}
