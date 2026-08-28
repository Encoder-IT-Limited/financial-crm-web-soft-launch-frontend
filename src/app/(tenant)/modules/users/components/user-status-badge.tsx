import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TenantUserStatus } from "../types";

const STATUS_CONFIG: Record<TenantUserStatus, { label: string; tone: "green" | "amber" | "neutral" }> = {
  ACTIVE: { label: "Active", tone: "green" },
  INVITED: { label: "Invited", tone: "amber" },
  DISABLED: { label: "Disabled", tone: "neutral" },
};

export function UserStatusBadge({ status, className }: { status: TenantUserStatus; className?: string }) {
  const { label, tone } = STATUS_CONFIG[status] ?? STATUS_CONFIG.ACTIVE;
  return (
    <Badge tone={tone} className={cn(className)}>
      {label}
    </Badge>
  );
}
