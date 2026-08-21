import { Badge } from "@/components/ui/badge";
import type { StockStatus } from "../types";
import { STOCK_STATUS_LABELS, STOCK_STATUS_TONES } from "../lib/stock";

export function StockStatusBadge({ status, label, className }: { status: StockStatus; label?: string; className?: string }) {
  return (
    <Badge tone={STOCK_STATUS_TONES[status]} className={className}>
      {label ?? STOCK_STATUS_LABELS[status]}
    </Badge>
  );
}