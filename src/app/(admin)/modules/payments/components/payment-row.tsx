import { fmtDateTime, fmtMoney } from "@/lib/format";
import { PAYMENT_TYPE_LABELS, type PaymentTransaction } from "../types";
import { PaymentStatusBadge } from "./payment-status-badge";

/** One payment transaction row, used by Dashboard's "Recent payments"
 * widget — /admin/payments itself uses a full FilterableTable instead. */
export function PaymentRow({ payment }: { payment: PaymentTransaction }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-4 py-3 last:border-b-0">
      <span className="text-[12.5px] font-semibold text-text min-[1440px]:text-[13.5px]">{payment.tenantName}</span>
      <span className="text-[11px] text-text-4 min-[1440px]:text-[12px]">{PAYMENT_TYPE_LABELS[payment.type]}</span>
      <span className="ml-auto text-[13px] font-semibold text-text min-[1440px]:text-[14px]">
        {fmtMoney(payment.amount)}
      </span>
      <PaymentStatusBadge status={payment.status} />
      <span className="text-[11px] text-text-4 min-[1440px]:text-[12px]">{fmtDateTime(payment.date)}</span>
    </div>
  );
}
