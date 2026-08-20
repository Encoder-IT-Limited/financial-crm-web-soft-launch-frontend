import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "../types";

const STATUS_CONFIG: Record<PaymentStatus, { label: string; tone: "green" | "amber" | "red" | "neutral" }> = {
  paid: { label: "Paid", tone: "green" },
  pending: { label: "Pending", tone: "amber" },
  failed: { label: "Failed", tone: "red" },
  refunded: { label: "Refunded", tone: "neutral" },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, tone } = STATUS_CONFIG[status];
  return <Badge tone={tone}>{label}</Badge>;
}
