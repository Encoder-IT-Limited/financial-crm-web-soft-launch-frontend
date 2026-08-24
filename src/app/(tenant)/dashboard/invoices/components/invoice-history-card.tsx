"use client";

import { Card } from "@/components/ui/card";
import { fmtDateTime, fmtMoney } from "@/lib/format";
import type { Invoice } from "../types";

/** The invoice detail page's "History" timeline card — extracted verbatim;
 * behavior unchanged. */
export function InvoiceHistoryCard({ invoice, customerEmail }: { invoice: Invoice; customerEmail: string | undefined }) {
  return (
    <Card className="gap-0 p-0">
      <div className="border-b border-border px-5 py-3 text-sm font-bold text-text">History</div>
      <div className="flex flex-col divide-y divide-border">
        <HistoryRow label="Invoice created" when={invoice.createdAt} />
        {invoice.sentAt && <HistoryRow label={`Sent to ${customerEmail ?? "customer"}`} when={invoice.sentAt} />}
        {invoice.lastReminderAt && <HistoryRow label="Reminder sent" when={invoice.lastReminderAt} />}
        {invoice.payments.map((payment) => (
          <HistoryRow key={payment.id} label={`Payment of ${fmtMoney(payment.amount, invoice.currency)}`} when={payment.date} />
        ))}
        {invoice.cancelledAt && <HistoryRow label="Invoice cancelled" when={invoice.cancelledAt} />}
      </div>
    </Card>
  );
}

function HistoryRow({ label, when }: { label: string; when: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3">
      <span className="text-[12.5px] text-text-2">{label}</span>
      <span className="text-[11px] text-text-4">{fmtDateTime(when)}</span>
    </div>
  );
}
