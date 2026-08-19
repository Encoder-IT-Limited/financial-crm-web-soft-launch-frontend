"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Ban, Download, PencilLine, Printer, Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeading } from "@/components/shared/page-heading";
import { toast } from "@/lib/toast";
import { fmtDate, fmtDateTime, fmtMoney } from "@/lib/format";
import {
  invoiceBalance,
  invoiceDisplayStatus,
  PAYMENT_METHOD_LABELS,
} from "../../../modules/billing/types";
import { useInvoicesStore } from "../../../modules/billing/store/invoices-store";
import { invoiceApi } from "../../../modules/billing/api/invoices.service";
import { InvoicePdf } from "../../../modules/billing/components/invoice-pdf";
import { InvoiceStatusBadge } from "../../../modules/billing/components/invoice-status-badge";
import { RecordPaymentDialog } from "../../../modules/billing/components/record-payment-dialog";
import { StatTiles } from "../../../modules/billing/components/stat-tiles";

export default function InvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const router = useRouter();

  const invoice = useInvoicesStore((state) => state.invoices.find((inv) => inv.id === params.invoiceId));
  const customers = useInvoicesStore((state) => state.customers);

  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!invoice) {
      const timer = setTimeout(() => router.replace("/dashboard/invoices"), 400);
      return () => clearTimeout(timer);
    }
  }, [invoice, router]);

  if (!invoice) {
    return (
      <div className="flex h-64 items-center justify-center text-[13px] text-text-4">
        Invoice not found — redirecting…
      </div>
    );
  }

  const status = invoiceDisplayStatus(invoice);
  const balance = invoiceBalance(invoice);
  const customer = customers.find((c) => c.id === invoice.customerId);

  const sendInvoice = async () => {
    setBusy("send");
    await invoiceApi.send(invoice.id);
    toast.success(`${invoice.number} sent to ${customer?.name ?? "customer"}`);
    setBusy(null);
  };

  const sendReminder = async () => {
    setBusy("reminder");
    await invoiceApi.sendReminder(invoice.id);
    toast.success(`Reminder sent to ${customer?.email}`);
    setBusy(null);
  };

  const cancelInvoice = async () => {
    setBusy("cancel");
    await invoiceApi.cancel(invoice.id);
    toast.success(`${invoice.number} cancelled`);
    setBusy(null);
    setCancelDialogOpen(false);
  };

  const canSend = invoice.status === "draft";
  const canEdit = invoice.status === "draft";
  const canPay = balance > 0 && (invoice.status === "sent" || invoice.status === "partially-paid");
  const canRemind = invoice.status === "sent" || invoice.status === "partially-paid";
  const canCancel = invoice.status === "draft" || invoice.status === "sent" || invoice.status === "partially-paid";

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
            {canRemind && (
              <Button variant="outline" size="sm" onClick={sendReminder} disabled={busy !== null}>
                {busy === "reminder" ? "Sending..." : "Send Reminder"}
              </Button>
            )}
            {canCancel && (
              <Button variant="ghost" size="sm" className="text-red" onClick={() => setCancelDialogOpen(true)}>
                <Ban /> Cancel
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => toast.success(`PDF downloaded — ${invoice.number}.pdf`)}>
              <Download /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer /> Print
            </Button>
          </>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <InvoiceStatusBadge status={status} />
        {invoice.lastReminderAt && status === "overdue" && (
          <span className="text-[11.5px] text-text-3">Last reminder {fmtDateTime(invoice.lastReminderAt)}</span>
        )}
      </div>

      <StatTiles
        tiles={[
          { label: "Total", value: fmtMoney(invoice.total, invoice.currency), tone: "blue" },
          { label: "Paid", value: fmtMoney(invoice.paidAmount, invoice.currency), tone: "green" },
          { label: "Balance Due", value: fmtMoney(balance, invoice.currency), tone: balance > 0 ? "amber" : "neutral" },
          { label: "VAT", value: fmtMoney(invoice.tax, invoice.currency), tone: "neutral" },
        ]}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InvoicePdf invoice={invoice} customer={customer} />
        </div>

        <div className="flex flex-col gap-4">
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
              {invoice.lastReminderAt && <HistoryRow label="Reminder sent" when={invoice.lastReminderAt} />}
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