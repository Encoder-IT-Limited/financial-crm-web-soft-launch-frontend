import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AdjustmentStatus } from "../types";

const STATUS_CONFIG: Record<AdjustmentStatus, { label: string; tone: "green" | "neutral" }> = {
  issued: { label: "Issued", tone: "green" },
  void: { label: "Void", tone: "neutral" },
};

export function AdjustmentStatusBadge({ status, className }: { status: AdjustmentStatus; className?: string }) {
  const { label, tone } = STATUS_CONFIG[status];
  return (
    <Badge tone={tone} className={cn(className)}>
      {label}
    </Badge>
  );
}
