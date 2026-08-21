"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, FileCheck2 } from "lucide-react";
import { EntityDetailsDialog } from "@/components/shared/entity-details-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/lib/toast";
import { fmtDateTime, fmtMoney } from "@/lib/format";
import { customersApi } from "../../crm/api/customers.service";
import { invoiceApi } from "../api/invoices.service";
import { adjustmentsApi } from "../api/adjustments.service";
import { AdjustmentStatusBadge } from "./adjustment-status-badge";

export function AdjustmentDetailsDialog({
  open,
  onOpenChange,
  adjustmentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adjustmentId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: adjustments = [] } = useQuery({ queryKey: ["adjustments"], queryFn: adjustmentsApi.list });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const { data: invoices = [] } = useQuery({ queryKey: ["invoices"], queryFn: invoiceApi.list });
  const adjustment = adjustments.find((a) => a.id === adjustmentId);

  const [voidOpen, setVoidOpen] = useState(false);
  const [converting, setConverting] = useState(false);

  if (!adjustment) return null;

  const customer = customers.find((c) => c.id === adjustment.customerId);
  const invoice = adjustment.invoiceId ? invoices.find((inv) => inv.id === adjustment.invoiceId) : undefined;
  const label = adjustment.kind === "credit" ? "Credit Note" : "Debit Note";
  const canConvert = adjustment.status === "issued" && !adjustment.invoiceId;

  async function convertToInvoice() {
    setConverting(true);
    const created = await adjustmentsApi.convertToInvoice(adjustment!.id);
    queryClient.invalidateQueries({ queryKey: ["adjustments"] });
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    setConverting(false);
    if (created) {
      toast.success(`${adjustment!.number} converted to ${created.number}`);
      onOpenChange(false);
      router.push(`/dashboard/invoices/${created.id}`);
    }
  }

  return (
    <>
      <EntityDetailsDialog
        open={open}
        onOpenChange={onOpenChange}
        title={adjustment.number}
        subtitle={`${label} · issued ${fmtDateTime(adjustment.createdAt)}`}
        statusSlot={<AdjustmentStatusBadge status={adjustment.status} />}
      >
        <div className="flex flex-col gap-4 px-1 py-1">
          <Field label="Amount" value={fmtMoney(adjustment.amount, adjustment.currency)} />
          <Field label="Customer" value={customer?.name ?? "—"} />
          <Field
            label="Linked invoice"
            value={
              invoice ? (
                <Link href={`/dashboard/invoices/${invoice.id}`} className="text-blue hover:underline">
                  {invoice.number}
                </Link>
              ) : (
                "—"
              )
            }
          />
          <Field label="Reason" value={adjustment.reason} />
          {adjustment.voidedAt && <Field label="Voided" value={fmtDateTime(adjustment.voidedAt)} />}

          {canConvert && (
            <div className="rounded-lg border border-blue-t bg-blue-l p-3 text-[11.5px] text-blue">
              {adjustment.kind === "debit" ? (
                <>
                  This debit note isn&apos;t linked to an invoice yet, so there&apos;s nothing the customer can pay against. Convert it
                  to generate a payable draft invoice for {fmtMoney(adjustment.amount, adjustment.currency)}.
                </>
              ) : (
                <>
                  This credit note isn&apos;t linked to an invoice yet. Convert it to generate a draft invoice for{" "}
                  {fmtMoney(-adjustment.amount, adjustment.currency)} — the negative value keeps the amount you owe this customer
                  reflected in the books.
                </>
              )}
            </div>
          )}

          <div className="mt-1 flex flex-wrap gap-2">
            {canConvert && (
              <Button size="sm" onClick={convertToInvoice} disabled={converting}>
                <FileCheck2 /> {converting ? "Converting..." : "Convert to Invoice"}
              </Button>
            )}
            {adjustment.status === "issued" && (
              <Button variant="outline" size="sm" className="text-red" onClick={() => setVoidOpen(true)}>
                <Ban /> Void this note
              </Button>
            )}
          </div>
        </div>
      </EntityDetailsDialog>

      <ConfirmDialog
        open={voidOpen}
        onOpenChange={setVoidOpen}
        title={`Void ${adjustment.number}?`}
        description="This reverses its effect on the linked invoice's balance. This cannot be undone."
        confirmLabel="Void note"
        destructive
        onConfirm={async () => {
          await adjustmentsApi.void(adjustment.id);
          queryClient.invalidateQueries({ queryKey: ["adjustments"] });
        }}
        successMessage={`${adjustment.number} voided`}
      />
    </>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] font-bold uppercase tracking-wide text-text-4">{label}</div>
      <div className="mt-0.5 text-[13px] text-text">{value}</div>
    </div>
  );
}
