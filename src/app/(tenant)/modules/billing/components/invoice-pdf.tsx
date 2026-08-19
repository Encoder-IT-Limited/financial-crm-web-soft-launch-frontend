"use client";

import { fmtDate, fmtMoney, fmtQty } from "@/lib/format";
import { cn } from "@/lib/utils";
import { invoiceBalance, type Customer, type Invoice } from "../types";
import { useInvoicesStore } from "../store/invoices-store";

/**
 * The printable / previewable invoice layout — mirrors the prototype's
 * `.pdf-preview` block (docs/mrm-portal-v3 (1).html §INVOICE PDF PREVIEW).
 * Reused on the list page preview dialog, the detail page, and window.print().
 */
export function InvoicePdf({ invoice, customer }: { invoice: Invoice; customer?: Customer }) {
  const org = useInvoicesStore((state) => state.orgProfile);
  const balance = invoiceBalance(invoice);
  const paid = invoice.paidAmount;
  const taxRate = Math.max(0, ...invoice.lines.map((l) => l.taxRate));

  return (
    <div className="rounded-[10px] border border-border bg-surface p-5 text-[12px] sm:p-7">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4 sm:mb-6">
        <div>
          <div className="text-lg font-extrabold text-blue sm:text-xl">{org.legalName}</div>
          <div className="mt-0.5 text-[11px] text-text-4">{org.email}</div>
          <div className="text-[11px] text-text-4">{org.address}</div>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xl font-bold text-text sm:text-[22px]">INVOICE</div>
          <div className="mt-0.5 text-[12px] font-semibold text-text-2">#{invoice.number}</div>
          <div className="text-[11.5px] text-text-4">Date: {fmtDate(invoice.issueDate)}</div>
          <div className="text-[11.5px] text-text-4">Due: {fmtDate(invoice.dueDate)}</div>
        </div>
      </div>

      {/* Bill to + QR */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-text-4">Bill To</div>
          <div className="font-semibold text-text">{customer?.name ?? "—"}</div>
          <div className="text-[11.5px] text-text-3">{customer?.email}</div>
          <div className="text-[11.5px] text-text-3">{customer?.address}</div>
          {customer?.trn && <div className="mt-1 text-[10.5px] text-text-3">TRN: {customer.trn}</div>}
        </div>
        <div className="hidden size-20 flex-col items-center justify-center rounded-[6px] border border-dashed border-border bg-surface-subtle text-center text-[10px] text-text-4 sm:flex">
          QR
          <br />
          Code
        </div>
      </div>

      {/* Items */}
      <div className="my-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-subtle text-[10px] font-bold text-text-4">
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-center">Qty</th>
              <th className="px-3 py-2 text-right">Unit Price</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.id} className="border-b border-border">
                <td className="px-3 py-2.5 text-text">{line.description}</td>
                <td className="px-3 py-2.5 text-center text-text-2">{fmtQty(line.quantity)}</td>
                <td className="px-3 py-2.5 text-right text-text-2">{fmtMoney(line.unitPrice)}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-text">{fmtMoney(line.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex flex-col items-end gap-1">
        <div className="flex w-full justify-between text-[12px] sm:w-56">
          <span className="text-text-3">Subtotal</span>
          <span className="text-text">{fmtMoney(invoice.subtotal)}</span>
        </div>
        <div className="flex w-full justify-between text-[12px] sm:w-56">
          <span className="text-text-3">VAT ({taxRate}%)</span>
          <span className="text-text">{fmtMoney(invoice.tax)}</span>
        </div>
        <div className="mt-1 flex w-full justify-between border-t-2 border-text pt-2 text-sm font-bold sm:w-56">
          <span>Total Due</span>
          <span className="text-blue">{fmtMoney(invoice.total)}</span>
        </div>
      </div>

      {/* Amount boxes */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-green-l p-2.5 text-center">
          <div className="text-[10px] font-bold uppercase text-green">Paid</div>
          <div className="mt-0.5 text-sm font-bold text-green">{fmtMoney(paid)}</div>
        </div>
        <div className="rounded-lg bg-amber-l p-2.5 text-center">
          <div className="text-[10px] font-bold uppercase text-amber">Balance Due</div>
          <div className="mt-0.5 text-sm font-bold text-amber">{fmtMoney(balance)}</div>
        </div>
        <div className="rounded-lg bg-blue-l p-2.5 text-center">
          <div className="text-[10px] font-bold uppercase text-blue">Credit Note</div>
          <div className="mt-0.5 text-sm font-bold text-blue">AED 0</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 border-t border-border pt-3 text-[11px] text-text-4">
        {invoice.notes && <div className="mb-1.5">{invoice.notes}</div>}
        <div className={cn("text-text-3")}>
          Bank: {org.bank} · IBAN: {org.iban} · Account: {org.accountName}
        </div>
      </div>
    </div>
  );
}