import { Suspense } from "react";
import { NewInvoicePage } from "@/app/(tenant)/modules/billing/components/new-invoice-page";

export default function Page() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />}>
      <NewInvoicePage />
    </Suspense>
  );
}
