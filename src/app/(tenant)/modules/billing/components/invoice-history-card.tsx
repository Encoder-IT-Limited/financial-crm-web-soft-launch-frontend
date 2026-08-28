"use client";

import { Card } from "@/components/ui/card";
import { fmtDateTime, fmtMoney } from "@/lib/format";
import type { Customer, Invoice } from "../types";

function HistoryRow({ label, when }: { label: string; when: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <span className="text-[12.5px] text-text-2">{label}</span>
      <span className="text-[11px] text-text-4">{fmtDateTime(when)}</span>
    </div>
  );
}

export function InvoiceHistoryCard({ invoice, customer }: { invoice: Invoice; customer?: Customer }) {
  return (
    <Card className="gap-0 p-0">
      <div className="border-b border-border px-5 py-3 text-sm font-bold text-text">History</div>
      <div className="flex flex-col divide-y divide-border">
        <HistoryRow label="Invoice created" when={invoice.createdAt} />
        {invoice.sentAt && <HistoryRow label={`Sent to ${customer?.email ?? "customer"}`} when={invoice.sentAt} />}
        {invoice.fulfilledAt && <HistoryRow label="Fully fulfilled" when={invoice.fulfilledAt} />}
        {invoice.payments.map((payment) => (
          <HistoryRow
            key={payment.id}
            label={`Payment of ${fmtMoney(payment.amount, invoice.currency)}`}
            when={payment.date}
          />
        ))}
        {invoice.cancelledAt && <HistoryRow label="Invoice cancelled" when={invoice.cancelledAt} />}
      </div>
    </Card>
  );
}
