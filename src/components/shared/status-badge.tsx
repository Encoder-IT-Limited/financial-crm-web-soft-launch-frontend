import { Badge } from "@/components/ui/badge";

export type TenantStatus = "active" | "read-only" | "pending-deletion" | "cancelled";

const STATUS_CONFIG: Record<TenantStatus, { label: string; tone: "green" | "amber" | "red" | "neutral" }> = {
  active: { label: "Active", tone: "green" },
  "read-only": { label: "Read-Only", tone: "amber" },
  "pending-deletion": { label: "Pending Deletion", tone: "red" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export function StatusBadge({ status }: { status: TenantStatus }) {
  const { label, tone } = STATUS_CONFIG[status];
  return <Badge tone={tone}>{label}</Badge>;
}
