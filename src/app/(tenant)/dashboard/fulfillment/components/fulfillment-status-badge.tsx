import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FULFILLMENT_STATUS_LABELS, type InvoiceFulfillmentStatus } from "../types";

const STATUS_TONE: Record<InvoiceFulfillmentStatus, "green" | "amber" | "neutral"> = {
  "not-applicable": "neutral",
  unfulfilled: "amber",
  "partially-fulfilled": "amber",
  fulfilled: "green",
};

export function FulfillmentStatusBadge({ status, className }: { status: InvoiceFulfillmentStatus; className?: string }) {
  return (
    <Badge tone={STATUS_TONE[status]} className={cn(className)}>
      {FULFILLMENT_STATUS_LABELS[status]}
    </Badge>
  );
}
