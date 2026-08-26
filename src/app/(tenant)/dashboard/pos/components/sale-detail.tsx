"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/shared/page-heading";
import { fmtDateTime, fmtMoney } from "@/lib/format";
import { POS_PAYMENT_METHOD_LABELS, saleRefundedAmount, type PosSaleStatus } from "../types";
import { posSalesApi } from "../api/sales.service";
import { posTerminalsApi } from "../api/terminals.service";
import { customersApi } from "../../../modules/crm/api/customers.service";
import { RefundDialog } from "./refund-dialog";

const STATUS_TONE: Record<PosSaleStatus, "green" | "amber" | "red"> = {
  completed: "green",
  "partially-refunded": "amber",
  refunded: "red",
};

export function SaleDetail() {
  const params = useParams<{ saleId: string }>();
  const router = useRouter();
  const [refundOpen, setRefundOpen] = useState(false);

  const { data: sale, isLoading } = useQuery({ queryKey: ["pos-sale", params.saleId], queryFn: () => posSalesApi.get(params.saleId) });
  const { data: refunds = [] } = useQuery({ queryKey: ["pos-refunds", params.saleId], queryFn: () => posSalesApi.listRefunds(params.saleId) });
  const { data: terminals = [] } = useQuery({ queryKey: ["pos-terminals"], queryFn: posTerminalsApi.list });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });

  if (isLoading || !sale) {
    return <div className="flex h-64 items-center justify-center text-[13px] text-text-4">{isLoading ? "Loading sale…" : "Sale not found"}</div>;
  }

  const terminal = terminals.find((t) => t.id === sale.terminalId);
  const customer = customers.find((c) => c.id === sale.customerId);
  const refundedAmount = saleRefundedAmount(sale.id, refunds);
  const canRefund = sale.status !== "refunded";

  return (
    <div>
      <PageHeading
        title={sale.number}
        subtitle={`${terminal?.name ?? "—"} · ${fmtDateTime(sale.createdAt)}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/pos/sales")}>
              <ArrowLeft /> Back
            </Button>
            {canRefund && (
              <Button size="sm" onClick={() => setRefundOpen(true)}>
                <Undo2 /> Refund / Return
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4">
        <Badge tone={STATUS_TONE[sale.status]}>{sale.status.replace("-", " ")}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-0 p-0 lg:col-span-2">
          <div className="border-b border-border px-5 py-3 text-sm font-bold text-text">Items</div>
          <div className="flex flex-col divide-y divide-border">
            {sale.lines.map((line) => (
              <div key={line.productId} className="flex items-center justify-between px-5 py-3 text-[12.5px]">
                <div>
                  <div className="font-semibold text-text">{line.name}</div>
                  <div className="text-text-3">
                    {line.quantity} × {fmtMoney(line.unitPrice)}
                  </div>
                </div>
                <span className="font-bold text-text">{fmtMoney(line.quantity * line.unitPrice - (line.discountAmount ?? 0))}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1 border-t border-border px-5 py-3 text-[12.5px] text-text-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{fmtMoney(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-green">
                <span>Discount</span>
                <span>−{fmtMoney(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>VAT</span>
              <span>{fmtMoney(sale.tax)}</span>
            </div>
            <div className="flex justify-between text-[14px] font-extrabold text-text">
              <span>Total</span>
              <span>{fmtMoney(sale.total)}</span>
            </div>
            {refundedAmount > 0 && (
              <div className="flex justify-between text-red">
                <span>Refunded</span>
                <span>−{fmtMoney(refundedAmount)}</span>
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="gap-0 p-0">
            <div className="border-b border-border px-5 py-3 text-sm font-bold text-text">Payment</div>
            <div className="flex flex-col divide-y divide-border">
              {sale.payments.map((p, i) => (
                <div key={i} className="flex justify-between px-5 py-2.5 text-[12.5px]">
                  <span className="text-text-2">{POS_PAYMENT_METHOD_LABELS[p.method]}</span>
                  <span className="font-semibold text-text">{fmtMoney(p.amount)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="gap-0 p-0">
            <div className="border-b border-border px-5 py-3 text-sm font-bold text-text">Details</div>
            <div className="flex flex-col gap-2 px-5 py-3 text-[12.5px]">
              <Row label="Customer" value={customer?.name ?? "Walk-in"} />
              <Row label="Cashier" value={sale.createdBy} />
            </div>
          </Card>

          {refunds.length > 0 && (
            <Card className="gap-0 p-0">
              <div className="border-b border-border px-5 py-3 text-sm font-bold text-text">Refunds</div>
              <div className="flex flex-col divide-y divide-border">
                {refunds.map((r) => (
                  <div key={r.id} className="px-5 py-2.5">
                    <div className="flex justify-between text-[12.5px] font-semibold text-text">
                      <span>{fmtMoney(r.amount)}</span>
                      <span className="text-text-3">{fmtDateTime(r.createdAt)}</span>
                    </div>
                    <div className="text-[11px] text-text-3">{r.reason}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <RefundDialog sale={sale} refunds={refunds} open={refundOpen} onOpenChange={setRefundOpen} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-3">{label}</span>
      <span className="font-semibold text-text">{value}</span>
    </div>
  );
}
