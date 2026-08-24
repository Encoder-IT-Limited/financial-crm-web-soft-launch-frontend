"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Download, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fmtDateTime, fmtQty } from "@/lib/format";
import { toast } from "@/lib/toast";
import { invoiceApi } from "../api/invoices.service";
import { billingKeys } from "../query-keys";
import { downloadDeliveryNotePdf, printDeliveryNote } from "../lib/invoice-print";
import {
  fulfillableLines,
  invoiceFulfillmentStatus,
  type Fulfillment,
  type Invoice,
} from "../types";
import { useCustomers } from "../../crm/hooks/use-customers";
import { FulfillmentStatusBadge } from "./fulfillment-status-badge";

export function InvoiceFulfillmentCard({ invoice }: { invoice: Invoice }) {
  const qc = useQueryClient();
  const { data: customers = [] } = useCustomers();
  const { data: org } = useQuery({ queryKey: ["org-profile"], queryFn: invoiceApi.getOrgProfile, staleTime: Infinity });
  const { data: fulfillments = invoice.fulfillments ?? [] } = useQuery({
    queryKey: billingKeys.fulfillments(invoice.id),
    queryFn: () => invoiceApi.listFulfillments(invoice.id),
    initialData: invoice.fulfillments,
    enabled: fulfillableLines(invoice).length > 0,
  });

  const reconcile = useMutation({
    mutationFn: (lineId: string) => invoiceApi.reconcileFulfillmentLine(lineId),
    onSuccess: async () => {
      toast.success("Line marked reconciled");
      await Promise.all([
        qc.invalidateQueries({ queryKey: billingKeys.fulfillments(invoice.id) }),
        qc.invalidateQueries({ queryKey: billingKeys.invoice(invoice.id) }),
        qc.invalidateQueries({ queryKey: billingKeys.pendingReconciliation() }),
        qc.invalidateQueries({ queryKey: ["alerts"] }),
      ]);
    },
    onError: (err: Error) => toast.error(err.message || "Could not reconcile"),
  });

  const status = invoiceFulfillmentStatus({ ...invoice, fulfillments });
  if (status === "not-applicable") return null;

  const customer = customers.find((c) => c.id === invoice.customerId);

  function handlePrint(fulfillment: Fulfillment) {
    if (!org || !fulfillment.deliveryNoteNumber) return;
    printDeliveryNote(fulfillment, invoice, customer, org);
  }

  function handleDownload(fulfillment: Fulfillment) {
    if (!org) return;
    downloadDeliveryNotePdf(fulfillment, invoice, customer, org);
  }

  return (
    <Card className="gap-0 p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="text-sm font-bold text-text">Fulfillment</div>
        <FulfillmentStatusBadge status={status} />
      </div>
      {fulfillments.length === 0 ? (
        <div className="px-5 py-6 text-center text-[12px] text-text-4">No shipments recorded yet.</div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {fulfillments.map((f) => (
            <div key={f.id} className="px-5 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold text-text">
                    {f.deliveryNoteNumber ? `Delivery note ${f.deliveryNoteNumber}` : "Shipment"}
                    {f.trigger === "pos-auto" && (
                      <span className="ml-2 text-[10px] font-medium uppercase text-text-4">POS</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-text-4">{fmtDateTime(f.fulfilledAt)}</div>
                </div>
                <div className="flex gap-1.5">
                  {f.deliveryNoteNumber && org && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handlePrint(f)}>
                        <Printer /> Print
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(f)}>
                        <Download /> PDF
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                {f.lines.map((line) => {
                  const desc = invoice.lines.find((l) => l.id === line.invoiceLineId)?.description ?? "—";
                  return (
                    <div key={line.id} className="flex items-center justify-between gap-2 text-[12px]">
                      <span className="text-text-2">{desc}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text">{fmtQty(line.quantityFulfilled)}</span>
                        {line.status === "pending-reconciliation" ? (
                          <>
                            <Badge tone="amber">Pending reconciliation</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={reconcile.isPending}
                              onClick={() => reconcile.mutate(line.id)}
                            >
                              <CheckCircle2 /> Mark reconciled
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
