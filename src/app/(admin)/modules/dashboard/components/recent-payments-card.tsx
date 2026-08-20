import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PaymentRow } from "../../payments/components/payment-row";
import type { PaymentTransaction } from "../../payments/types";

export function RecentPaymentsCard({ payments }: { payments: PaymentTransaction[] }) {
  const recent = payments.slice(0, 5);

  return (
    <Card className="flex flex-col gap-3 overflow-hidden p-0">
      <div className="flex items-center justify-between px-5 pt-5">
        <h3 className="text-[13px] font-bold text-text min-[1440px]:text-[14px]">Recent payments</h3>
        <Link
          href="/admin/payments"
          className="text-[11.5px] font-semibold text-blue hover:underline min-[1440px]:text-[12.5px]"
        >
          View all
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="px-5 pb-5 text-[12.5px] text-text-4 min-[1440px]:text-[13.5px]">No transactions yet.</p>
      ) : (
        <div className="pb-1">
          {recent.map((payment) => (
            <PaymentRow key={payment.id} payment={payment} />
          ))}
        </div>
      )}
    </Card>
  );
}
