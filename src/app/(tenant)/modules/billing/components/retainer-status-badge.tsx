import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RetainerStatus } from "../types";

const STATUS_CONFIG: Record<RetainerStatus, { label: string; tone: "green" | "amber" | "neutral" }> = {
  active: { label: "Active", tone: "green" },
  paused: { label: "Paused", tone: "amber" },
  closed: { label: "Closed", tone: "neutral" },
};

export function RetainerStatusBadge({ status, className }: { status: RetainerStatus; className?: string }) {
  const { label, tone } = STATUS_CONFIG[status];
  return (
    <Badge tone={tone} className={cn(className)}>
      {label}
    </Badge>
  );
}
