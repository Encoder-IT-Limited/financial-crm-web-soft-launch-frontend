"use client";

import { Card } from "@/components/ui/card";
import { fmtDate, fmtMoney } from "@/lib/format";
import { PAYMENT_METHOD_LABELS, type Currency, type Payment } from "../types";

export function InvoicePaymentHistoryCard({
  payments,
  currency,
}: {
  payments: Payment[];
  currency: Currency;
}) {
  return (
    <Card className="gap-0 p-0">
      <div className="border-b border-border px-5 py-3 text-sm font-bold text-text">Payment history</div>
      {payments.length === 0 ? (
        <div className="px-5 py-6 text-center text-[12px] text-text-4">No payments recorded yet.</div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {payments.map((payment) => (
            <div key={payment.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
              <div>
                <div className="text-[13px] font-semibold text-text">{fmtMoney(payment.amount, currency)}</div>
                <div className="mt-0.5 text-[11px] text-text-3">
                  {PAYMENT_METHOD_LABELS[payment.method]}
                  {payment.reference ? ` · ${payment.reference}` : ""}
                </div>
              </div>
              <span className="text-[11.5px] text-text-4">{fmtDate(payment.date)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
