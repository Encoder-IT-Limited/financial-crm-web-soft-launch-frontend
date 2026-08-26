import { Suspense } from "react";
import { StockTransfersPage } from "@/app/(tenant)/modules/inventory/components/stock-transfers-page";

export default function Page() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />}>
      <StockTransfersPage />
    </Suspense>
  );
}
