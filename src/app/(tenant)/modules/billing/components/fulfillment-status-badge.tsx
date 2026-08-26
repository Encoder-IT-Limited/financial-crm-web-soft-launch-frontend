"use client";

import { Badge } from "@/components/ui/badge";
import type { InvoiceFulfillmentStatus } from "../types";

const CONFIG: Record<InvoiceFulfillmentStatus, { label: string; tone: "neutral" | "amber" | "green" }> = {
  "not-applicable": { label: "N/A", tone: "neutral" },
  unfulfilled: { label: "Unfulfilled", tone: "amber" },
  "partially-fulfilled": { label: "Partially fulfilled", tone: "amber" },
  fulfilled: { label: "Fulfilled", tone: "green" },
};

export function FulfillmentStatusBadge({ status }: { status: InvoiceFulfillmentStatus }) {
  const { label, tone } = CONFIG[status];
  return <Badge tone={tone}>{label}</Badge>;
}
