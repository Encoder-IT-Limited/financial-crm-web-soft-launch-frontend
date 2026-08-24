"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ban, Download, PackageCheck, PencilLine, Printer, Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeading } from "@/components/shared/page-heading";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { fmtDate, fmtDateTime, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  adjustedInvoiceBalance,
  adjustmentsForInvoice,
  fulfillableLines,
  invoiceBalance,
  invoiceDisplayStatus,
  invoiceFulfillmentStatus,
  PAYMENT_METHOD_LABELS,
  remainingFulfillQuantity,
} from "../types";
import { invoiceApi } from "../api/invoices.service";
import { adjustmentsApi } from "../api/adjustments.service";
import { downloadInvoicePdf } from "../lib/invoice-print";
import { useCustomers } from "../../crm/hooks/use-customers";
import { billingKeys } from "../query-keys";
import { InvoicePdf } from "./invoice-pdf";
import { InvoiceStatusBadge } from "./invoice-status-badge";
import { AdjustmentStatusBadge } from "./adjustment-status-badge";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { StatTiles } from "./stat-tiles";
import { FulfillmentDialog } from "./fulfillment-dialog";
import { InvoiceFulfillmentCard } from "./invoice-fulfillment-card";

export function InvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: billingKeys.invoice(params.invoiceId),
    queryFn: () => invoiceApi.get(params.invoiceId),
  });
  const { data: customers = [] } = useCustomers();
  const { data: adjustments = [] } = useQuery({ queryKey: billingKeys.adjustments(), queryFn: adjustmentsApi.list });
  const { data: org } = useQuery({ queryKey: ["org-profile"], queryFn: invoiceApi.getOrgProfile, staleTime: Infinity });

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [fulfillOpen, setFulfillOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceLoading && !invoice) {
      const timer = setTimeout(() => router.replace("/dashboard/invoices"), 400);
      return () => clearTimeout(timer);
    }
  }, [invoiceLoading, invoice, router]);

  if (invoiceLoading || !invoice) {
    return (
      <div className="flex h-64 items-center justify-center text-[13px] text-text-4">
        {invoiceLoading ? "Loading invoice…" : "Invoice not found — redirecting…"}
      </div>
    );
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: billingKeys.invoice(invoice!.id) });
    queryClient.invalidateQueries({ queryKey: billingKeys.invoices() });
    queryClient.invalidateQueries({ queryKey: billingKeys.fulfillments(invoice!.id) });
    queryClient.invalidateQueries({ queryKey: billingKeys.pendingReconciliation() });
    queryClient.invalidateQueries({ queryKey: billingKeys.nextNumber() });
    queryClient.invalidateQueries({ queryKey: ["alerts"] });
  }

  const status = invoiceDisplayStatus(invoice);
  const balance = invoiceBalance(invoice);
  const invoiceAdjustments = adjustmentsForInvoice(adjustments, invoice.id);
  const displayedBalance = adjustedInvoiceBalance(invoice, invoiceAdjustments);
  const customer = customers.find((c) => c.id === invoice.customerId);
  const fulfillmentStatus = invoiceFulfillmentStatus(invoice);

  const sendInvoice = async () => {
    setBusy("send");
    try {
      await invoiceApi.send(invoice.id);
      invalidate();
      toast.success(`${invoice.number} sent to ${customer?.name ?? "customer"}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Send failed");
    } finally {
      setBusy(null);
    }
  };

  const fulfillInvoice = async (input: Parameters<typeof invoiceApi.fulfill>[1]) => {
    setBusy("fulfill");
    try {
      const result = await invoiceApi.fulfill(invoice.id, input);
      invalidate();
      const note = result.fulfillment.deliveryNoteNumber
        ? ` — delivery note ${result.fulfillment.deliveryNoteNumber}`
        : "";
      toast.success(`${invoice.number} fulfilled${note}`);
      setFulfillOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Fulfillment failed");
    } finally {
      setBusy(null);
    }
  };

  const cancelInvoice = async () => {
    setBusy("cancel");
    try {
      await invoiceApi.cancel(invoice.id);
      invalidate();
      toast.success(`${invoice.number} cancelled`);
      setCancelDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Cancel failed");
    } finally {
      setBusy(null);
    }
  };

  const handlePrintPdf = () => {
    if (!org) {
      toast.error("Organization profile not loaded yet");
      return;
    }
    downloadInvoicePdf(invoice, customer, org);
    toast.success(`Downloaded ${invoice.number}.pdf`);
  };

  const canSend = invoice.status === "draft";
  const canEdit = invoice.status === "draft";
  const canPay = balance > 0 && (invoice.status === "sent" || invoice.status === "partially-paid");
  const canFulfill =
    invoice.status !== "draft" &&
    invoice.status !== "cancelled" &&
    fulfillableLines(invoice).some((line) => remainingFulfillQuantity(invoice, line) > 0);
  const canCancel = invoice.status === "draft" || invoice.status === "sent";

  return (
    <div>
      <PageHeading
        title={invoice.number}
        subtitle={`Issued ${fmtDate(invoice.issueDate)} · Due ${fmtDate(invoice.dueDate)}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/invoices")}>
              <ArrowLeft /> Back
            </Button>
            {canEdit && (
              <Link href={`/dashboard/invoices/new?edit=${invoice.id}`}>
                <Button variant="outline" size="sm">
                  <PencilLine /> Edit
                </Button>
              </Link>
            )}
            {canPay && (
              <Button size="sm" onClick={() => setPayDialogOpen(true)}>
                <UserPlus /> Record Payment
              </Button>
            )}
            {canSend && (
              <Button size="sm" onClick={sendInvoice} disabled={busy !== null}>
                <Send /> {busy === "send" ? "Sending..." : "Send Invoice"}
              </Button>
            )}
            {canFulfill && (
              <Button variant="outline" size="sm" onClick={() => setFulfillOpen(true)} disabled={busy !== null}>
                <PackageCheck /> Fulfill stock
              </Button>
            )}
            {canCancel && (
              <Button variant="ghost" size="sm" className="text-red" onClick={() => setCancelDialogOpen(true)}>
                <Ban /> Cancel
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handlePrintPdf}>
              <Download /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintPdf}>
              <Printer /> Print
            </Button>
          </>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <InvoiceStatusBadge status={status} />
        {fulfillmentStatus !== "not-applicable" && (
          <span className="text-[11.5px] capitalize text-text-3">{fulfillmentStatus.replace(/-/g, " ")}</span>
        )}
        {invoice.lastReminderAt && status === "overdue" && (
          <span className="text-[11.5px] text-text-3">Last reminder {fmtDateTime(invoice.lastReminderAt)}</span>
        )}
      </div>

      <StatTiles
        tiles={[
          { label: "Total", value: fmtMoney(invoice.total, invoice.currency), tone: "blue" },
          { label: "Paid", value: fmtMoney(invoice.paidAmount, invoice.currency), tone: "green" },
          {
            label: "Balance Due",
            value: fmtMoney(displayedBalance, invoice.currency),
            tone: displayedBalance > 0 ? "amber" : "neutral",
            sub: invoiceAdjustments.length > 0 ? "after adjustments" : undefined,
          },
          { label: "VAT", value: fmtMoney(invoice.tax, invoice.currency), tone: "neutral" },
        ]}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InvoicePdf invoice={invoice} customer={customer} />
        </div>

        <div className="flex flex-col gap-4">
          <InvoiceFulfillmentCard invoice={invoice} />

          {invoiceAdjustments.length > 0 && (
            <Card className="gap-0 p-0">
              <div className="border-b border-border px-5 py-3 text-sm font-bold text-text">Adjustments</div>
              <div className="flex flex-col divide-y divide-border">
                {invoiceAdjustments.map((adj) => (
                  <div key={adj.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                    <div>
                      <div className="flex items-center gap-1.5 text-[13px] font-semibold text-text">
                        {adj.number}
                        <AdjustmentStatusBadge status={adj.status} />
                      </div>
                      <div className="mt-0.5 text-[11px] text-text-3">{adj.reason}</div>
                    </div>
                    <span className={cn("shrink-0 text-[13px] font-semibold", adj.kind === "credit" ? "text-green" : "text-amber")}>
                      {adj.kind === "credit" ? "−" : "+"}
                      {fmtMoney(adj.amount, invoice.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="gap-0 p-0">
            <div className="border-b border-border px-5 py-3 text-sm font-bold text-text">
              Payment history
            </div>
            {invoice.payments.length === 0 ? (
              <div className="px-5 py-6 text-center text-[12px] text-text-4">No payments recorded yet.</div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                    <div>
                      <div className="text-[13px] font-semibold text-text">{fmtMoney(payment.amount, invoice.currency)}</div>
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

          <Card className="gap-0 p-0">
            <div className="border-b border-border px-5 py-3 text-sm font-bold text-text">History</div>
            <div className="flex flex-col divide-y divide-border">
              <HistoryRow label="Invoice created" when={invoice.createdAt} />
              {invoice.sentAt && <HistoryRow label={`Sent to ${customer?.email ?? "customer"}`} when={invoice.sentAt} />}
              {invoice.fulfilledAt && <HistoryRow label="Fully fulfilled" when={invoice.fulfilledAt} />}
              {invoice.payments.map((payment) => (
                <HistoryRow key={payment.id} label={`Payment of ${fmtMoney(payment.amount, invoice.currency)}`} when={payment.date} />
              ))}
              {invoice.cancelledAt && <HistoryRow label="Invoice cancelled" when={invoice.cancelledAt} />}
            </div>
          </Card>
        </div>
      </div>

      <RecordPaymentDialog
        invoice={canPay ? invoice : null}
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
      />

      <FulfillmentDialog
        invoice={invoice}
        open={fulfillOpen}
        onOpenChange={setFulfillOpen}
        onSubmit={fulfillInvoice}
        submitting={busy === "fulfill"}
      />

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title={`Cancel ${invoice.number}?`}
        description={
          balance > 0
            ? `This invoice has an outstanding balance of ${fmtMoney(balance, invoice.currency)}. Cancelling writes it off and the customer will not be charged.`
            : "This will permanently cancel the invoice."
        }
        confirmLabel="Cancel Invoice"
        destructive
        onConfirm={cancelInvoice}
        successMessage={`${invoice.number} cancelled`}
      />
    </div>
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
