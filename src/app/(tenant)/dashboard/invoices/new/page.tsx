import { Suspense } from "react";
import { NewInvoiceForm } from "../components/new-invoice-form";

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />}>
      <NewInvoiceForm />
    </Suspense>
  );
}
