import { fmtDate, fmtMoney, fmtQty } from "@/lib/format";
import { escapeHtml, openPrintWindow } from "@/lib/print-document";
import type { Customer, Fulfillment, Invoice, OrgProfile } from "../types";
import { jsPDF } from "jspdf";

export function buildInvoicePrintHtml(invoice: Invoice, customer: Customer | undefined, org: OrgProfile): string {
  const rows = invoice.lines
    .map(
      (line) =>
        `<tr>
          <td>${escapeHtml(line.description)}</td>
          <td style="text-align:center">${fmtQty(line.quantity)}</td>
          <td style="text-align:right">${fmtMoney(line.unitPrice, invoice.currency)}</td>
          <td style="text-align:right">${fmtMoney(line.total, invoice.currency)}</td>
        </tr>`,
    )
    .join("");

  return `
    <div style="display:flex;justify-content:space-between;gap:24px;margin-bottom:20px">
      <div>
        <div style="font-size:18px;font-weight:800">${escapeHtml(org.legalName)}</div>
        <div class="muted">${escapeHtml(org.email)}</div>
        <div class="muted">${escapeHtml(org.address)}</div>
      </div>
      <div style="text-align:right">
        <h1>INVOICE</h1>
        <div><strong>#${escapeHtml(invoice.number)}</strong></div>
        <div class="muted">Date: ${fmtDate(invoice.issueDate)}</div>
        <div class="muted">Due: ${fmtDate(invoice.dueDate)}</div>
      </div>
    </div>
    <div style="margin-bottom:16px">
      <div class="muted" style="font-size:10px;font-weight:700;text-transform:uppercase">Bill To</div>
      <div style="font-weight:600">${escapeHtml(customer?.name ?? "—")}</div>
      <div class="muted">${escapeHtml(customer?.email ?? "")}</div>
      <div class="muted">${escapeHtml(customer?.address ?? "")}</div>
    </div>
    <table>
      <thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      <div><span class="muted">Subtotal</span><span>${fmtMoney(invoice.subtotal, invoice.currency)}</span></div>
      ${invoice.discount > 0 ? `<div><span class="muted">Discount</span><span>−${fmtMoney(invoice.discount, invoice.currency)}</span></div>` : ""}
      <div><span class="muted">VAT</span><span>${fmtMoney(invoice.tax, invoice.currency)}</span></div>
      <div class="total-row"><span>Total Due</span><span>${fmtMoney(invoice.total, invoice.currency)}</span></div>
    </div>
    ${invoice.notes ? `<p class="muted" style="margin-top:16px">${escapeHtml(invoice.notes)}</p>` : ""}
  `;
}

export function buildDeliveryNotePrintHtml(
  fulfillment: Fulfillment,
  invoice: Invoice,
  customer: Customer | undefined,
  org: OrgProfile,
  lineDescriptions: Map<string, string>,
): string {
  const rows = fulfillment.lines
    .map((line) => {
      const desc = lineDescriptions.get(line.invoiceLineId) ?? "—";
      return `<tr>
        <td>${escapeHtml(desc)}</td>
        <td style="text-align:center">${fmtQty(line.quantityFulfilled)}</td>
        <td>${line.status === "pending-reconciliation" ? "Pending reconciliation" : "Fulfilled"}</td>
      </tr>`;
    })
    .join("");

  return `
    <div style="display:flex;justify-content:space-between;gap:24px;margin-bottom:20px">
      <div>
        <div style="font-size:18px;font-weight:800">${escapeHtml(org.legalName)}</div>
        <div class="muted">${escapeHtml(org.address)}</div>
      </div>
      <div style="text-align:right">
        <h1>DELIVERY NOTE</h1>
        <div><strong>#${escapeHtml(fulfillment.deliveryNoteNumber ?? fulfillment.id.slice(0, 8))}</strong></div>
        <div class="muted">Date: ${fmtDate(fulfillment.fulfilledAt.slice(0, 10))}</div>
        <div class="muted">Invoice: ${escapeHtml(invoice.number)}</div>
      </div>
    </div>
    <div style="margin-bottom:16px">
      <div class="muted" style="font-size:10px;font-weight:700;text-transform:uppercase">Deliver To</div>
      <div style="font-weight:600">${escapeHtml(customer?.name ?? "—")}</div>
      <div class="muted">${escapeHtml(customer?.address ?? "")}</div>
    </div>
    <table>
      <thead><tr><th>Description</th><th>Qty Shipped</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${fulfillment.notes ? `<p class="muted" style="margin-top:16px">${escapeHtml(fulfillment.notes)}</p>` : ""}
  `;
}

export function printInvoice(invoice: Invoice, customer: Customer | undefined, org: OrgProfile): void {
  openPrintWindow(`${invoice.number} — Invoice`, buildInvoicePrintHtml(invoice, customer, org));
}

export function printDeliveryNote(
  fulfillment: Fulfillment,
  invoice: Invoice,
  customer: Customer | undefined,
  org: OrgProfile,
): void {
  const lineDescriptions = new Map(invoice.lines.map((l) => [l.id, l.description]));
  const title = fulfillment.deliveryNoteNumber ?? `Delivery ${fulfillment.id.slice(0, 8)}`;
  openPrintWindow(
    `${title} — Delivery Note`,
    buildDeliveryNotePrintHtml(fulfillment, invoice, customer, org, lineDescriptions),
  );
}

/** Generates a real `.pdf` file download (jsPDF). */
export function downloadInvoicePdf(invoice: Invoice, customer: Customer | undefined, org: OrgProfile): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(org.legalName || "Invoice", left, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  if (org.email) {
    doc.text(org.email, left, y);
    y += 14;
  }
  if (org.address) {
    doc.text(org.address, left, y);
    y += 14;
  }
  doc.setTextColor(0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("INVOICE", 400, 56);
  doc.setFontSize(11);
  doc.text(`#${invoice.number}`, 400, 74);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Date: ${fmtDate(invoice.issueDate)}`, 400, 90);
  doc.text(`Due: ${fmtDate(invoice.dueDate)}`, 400, 104);

  y = Math.max(y, 120);
  doc.setFont("helvetica", "bold");
  doc.text("Bill To", left, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.text(customer?.name ?? "—", left, y);
  y += 14;
  if (customer?.email) {
    doc.text(customer.email, left, y);
    y += 14;
  }
  if (customer?.address) {
    doc.text(customer.address, left, y);
    y += 14;
  }

  y += 16;
  doc.setFont("helvetica", "bold");
  doc.text("Description", left, y);
  doc.text("Qty", 320, y);
  doc.text("Unit", 380, y);
  doc.text("Total", 480, y);
  y += 8;
  doc.setDrawColor(200);
  doc.line(left, y, 547, y);
  y += 16;
  doc.setFont("helvetica", "normal");

  for (const line of invoice.lines) {
    if (y > 720) {
      doc.addPage();
      y = 56;
    }
    const desc = doc.splitTextToSize(line.description, 250);
    doc.text(desc, left, y);
    doc.text(String(line.quantity), 320, y);
    doc.text(fmtMoney(line.unitPrice, invoice.currency), 380, y);
    doc.text(fmtMoney(line.total, invoice.currency), 480, y);
    y += Math.max(18, desc.length * 12);
  }

  y += 12;
  doc.line(left, y, 547, y);
  y += 18;
  doc.text(`Subtotal: ${fmtMoney(invoice.subtotal, invoice.currency)}`, 380, y);
  y += 14;
  if (invoice.discount > 0) {
    doc.text(`Discount: −${fmtMoney(invoice.discount, invoice.currency)}`, 380, y);
    y += 14;
  }
  doc.text(`VAT: ${fmtMoney(invoice.tax, invoice.currency)}`, 380, y);
  y += 16;
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${fmtMoney(invoice.total, invoice.currency)}`, 380, y);

  doc.save(`${invoice.number}.pdf`);
}

export function downloadDeliveryNotePdf(
  fulfillment: Fulfillment,
  invoice: Invoice,
  customer: Customer | undefined,
  org: OrgProfile,
): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  let y = 56;
  const number = fulfillment.deliveryNoteNumber ?? fulfillment.id.slice(0, 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(org.legalName || "Delivery Note", left, y);
  doc.setFontSize(18);
  doc.text("DELIVERY NOTE", 380, 56);
  doc.setFontSize(11);
  doc.text(`#${number}`, 380, 74);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Date: ${fmtDate(fulfillment.fulfilledAt.slice(0, 10))}`, 380, 90);
  doc.text(`Invoice: ${invoice.number}`, 380, 104);

  y = 120;
  doc.setFont("helvetica", "bold");
  doc.text("Deliver To", left, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.text(customer?.name ?? "—", left, y);
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.text("Item", left, y);
  doc.text("Qty", 400, y);
  doc.text("Status", 460, y);
  y += 8;
  doc.line(left, y, 547, y);
  y += 16;
  doc.setFont("helvetica", "normal");

  for (const line of fulfillment.lines) {
    const desc = invoice.lines.find((l) => l.id === line.invoiceLineId)?.description ?? "—";
    doc.text(doc.splitTextToSize(desc, 320), left, y);
    doc.text(String(line.quantityFulfilled), 400, y);
    doc.text(line.status === "pending-reconciliation" ? "Pending" : "OK", 460, y);
    y += 18;
  }

  doc.save(`${number}.pdf`);
}
