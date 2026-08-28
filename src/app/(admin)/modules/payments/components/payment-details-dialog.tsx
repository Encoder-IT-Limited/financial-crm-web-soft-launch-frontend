"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EntityDetailsDialog } from "@/components/shared/entity-details-dialog";
import { fmtDateTime, fmtMoney } from "@/lib/format";
import { toast } from "@/lib/toast";
import { paymentsApi } from "../api/payments.service";
import { PAYMENT_TYPE_LABELS, type PaymentStatus } from "../types";
import { PaymentStatusBadge } from "./payment-status-badge";

const STATUS_OPTIONS: PaymentStatus[] = ["paid", "pending", "failed", "refunded"];

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase text-text-4 min-[1440px]:text-[12px]">{label}</div>
      <div className="text-[13px] font-semibold text-text min-[1440px]:text-[14px]">{value}</div>
    </div>
  );
}

export function PaymentDetailsDialog({
  open,
  onOpenChange,
  paymentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId: string;
}) {
  const queryClient = useQueryClient();
  const { data: payment } = useQuery({
    queryKey: ["payments", paymentId],
    queryFn: () => paymentsApi.get(paymentId),
    enabled: open,
  });

  if (!payment) return null;
  const currentPayment = payment;

  function handleStatusChange(status: PaymentStatus) {
    if (status === currentPayment.status) return;
    paymentsApi
      .updateStatus(currentPayment.id, status)
      .then(() => {
        toast.success(`${currentPayment.reference} marked ${status}`);
        queryClient.invalidateQueries({ queryKey: ["payments"] });
        queryClient.invalidateQueries({ queryKey: ["audit"] });
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Could not update payment");
      });
  }

  async function handleDownload() {
    try {
      await paymentsApi.downloadInvoice(currentPayment.id, currentPayment.reference);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not download invoice");
    }
  }

  async function handleRefund() {
    try {
      await paymentsApi.refund(currentPayment.id);
      toast.success(`${currentPayment.reference} refunded`);
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["audit"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not refund payment");
    }
  }

  return (
    <EntityDetailsDialog
      open={open}
      onOpenChange={onOpenChange}
      title={payment.reference}
      subtitle={payment.tenantName}
      statusSlot={<PaymentStatusBadge status={payment.status} />}
    >
      <div className="flex flex-col gap-5 py-1">
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          <Field
            label="Tenant"
            value={
              <Link href="/admin/tenants" className="text-blue hover:underline">
                {payment.tenantName}
              </Link>
            }
          />
          <Field label="Reference" value={payment.reference} />
          <Field label="Plan/Subscription" value={payment.planName} />
          <Field label="Type" value={PAYMENT_TYPE_LABELS[payment.type] ?? payment.type} />
          <Field label="Amount" value={fmtMoney(payment.amount)} />
          <Field label="Method" value={<span className="uppercase">{payment.method}</span>} />
          <Field label="Date" value={fmtDateTime(payment.date)} />
          <Field
            label="Status"
            value={
              <Select value={payment.status} onValueChange={(v) => v && handleStatusChange(v as PaymentStatus)}>
                <SelectTrigger size="sm" className="w-fit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      <PaymentStatusBadge status={status} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          />
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="w-fit" onClick={handleDownload}>
            <Download /> Download invoice
          </Button>
          {payment.status !== "refunded" && (
            <Button type="button" variant="outline" className="w-fit" onClick={handleRefund}>
              Refund
            </Button>
          )}
        </div>
      </div>
    </EntityDetailsDialog>
  );
}
