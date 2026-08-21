import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CustomerStatus } from "../types";

const STATUS_CONFIG: Record<CustomerStatus, { label: string; tone: "green" | "neutral" }> = {
  active: { label: "Active", tone: "green" },
  inactive: { label: "Inactive", tone: "neutral" },
};

export function CustomerStatusBadge({ status, className }: { status: CustomerStatus; className?: string }) {
  const { label, tone } = STATUS_CONFIG[status];
  return (
    <Badge tone={tone} className={cn(className)}>
      {label}
    </Badge>
  );
}
