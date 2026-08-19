import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InvoiceDisplayStatus } from "../types";

const STATUS_CONFIG: Record<
  InvoiceDisplayStatus,
  { label: string; tone: "green" | "amber" | "red" | "neutral" | "blue" }
> = {
  draft: { label: "Draft", tone: "neutral" },
  sent: { label: "Sent", tone: "blue" },
  "partially-paid": { label: "Partially Paid", tone: "amber" },
  paid: { label: "Paid", tone: "green" },
  overdue: { label: "Overdue", tone: "red" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export function InvoiceStatusBadge({ status, className }: { status: InvoiceDisplayStatus; className?: string }) {
  const { label, tone } = STATUS_CONFIG[status];
  return (
    <Badge tone={tone} className={cn(className)}>
      {label}
    </Badge>
  );
}