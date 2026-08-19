"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Save, Eye, UserPlus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { fmtMoney, nextSequence } from "@/lib/format";
import { invoiceFormSchema } from "../../../modules/billing/schemas";
import { computeTotals, type Currency, type Invoice } from "../../../modules/billing/types";
import { useInvoicesStore } from "../../../modules/billing/store/invoices-store";
import { invoiceApi } from "../../../modules/billing/api/invoices.service";
import { LineItemsEditor, emptyLines, type LineDraft } from "../../../modules/billing/components/line-items-editor";
import { FormField } from "../../../modules/billing/components/form-field";
import { AddCustomerDialog } from "../../../modules/billing/components/add-customer-dialog";
import { InvoicePreviewDialog } from "../../../modules/billing/components/invoice-preview-dialog";
import { PageHeading } from "@/components/shared/page-heading";

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />}>
      <NewInvoiceForm />
    </Suspense>
  );
}

function NewInvoiceForm() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");

  const customers = useInvoicesStore((state) => state.customers);
  const invoiceSeq = useInvoicesStore((state) => state.invoiceSeq);
  const [editing, setEditing] = useState<Invoice | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [currency, setCurrency] = useState<Currency>("AED");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [lines, setLines] = useState<LineDraft[]>(emptyLines);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<"draft" | "send" | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  // Load the invoice being edited (draft only) — /invoices/new?edit=<id>
  useEffect(() => {
    if (!editId) return;
    invoiceApi.get(editId).then((invoice) => {
      if (!invoice || invoice.status !== "draft") {
        toast.error("Only draft invoices can be edited");
        router.replace("/dashboard/invoices");
        return;
      }
      setEditing(invoice);
      setCustomerId(invoice.customerId);
      setCurrency(invoice.currency ?? "AED");
      setDiscountPercent(String(invoice.discountPercent ?? 0));
      setIssueDate(invoice.issueDate);
      setDueDate(invoice.dueDate);
      setLines(
        invoice.lines.map((l) => ({
          id: l.id,
          description: l.description,
          quantity: String(l.quantity),
          unitPrice: String(l.unitPrice),
          taxRate: String(l.taxRate),
        }))
      );
      setNotes(invoice.notes ?? "");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const nextNumber = `INV-${nextSequence(invoiceSeq)}`;
  const discountPct = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const totals = useMemo(
    () =>
      computeTotals(
        lines.map((l) => ({
          quantity: Number(l.quantity) || 0,
          unitPrice: Number(l.unitPrice) || 0,
          taxRate: Number(l.taxRate) || 0,
        })),
        discountPct
      ),
    [lines, discountPct]
  );

  const previewInvoice: Invoice = useMemo(
    () => ({
      id: "preview",
      number: editing?.number ?? nextNumber,
      customerId: customerId || customers[0]?.id || "",
      issueDate,
      dueDate,
      currency,
      lines: lines.map((l) => ({
        id: l.id,
        description: l.description || "—",
        quantity: Number(l.quantity) || 0,
        unitPrice: Number(l.unitPrice) || 0,
        taxRate: Number(l.taxRate) || 0,
        total: (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0),
      })),
      subtotal: totals.subtotal,
      discountPercent: discountPct || undefined,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,
      paidAmount: editing?.paidAmount ?? 0,
      status: "draft",
      notes,
      createdBy: "Salma H.",
      createdAt: new Date().toISOString(),
      payments: editing?.payments ?? [],
    }),
    [customers, customerId, currency, dueDate, editing, issueDate, lines, nextNumber, notes, discountPct, totals]
  );

  function validate(): boolean {
    const result = invoiceFormSchema.safeParse({
      customerId,
      issueDate,
      dueDate,
      currency,
      discountPercent,
      lines: lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate,
      })),
      notes,
    });
    if (result.success) {
      setErrors({});
      return true;
    }

    const mapped: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const [first, second, field] = issue.path;
      if (first === "lines" && typeof second === "number" && typeof field === "string") {
        const line = lines[second];
        if (line) mapped[`${line.id}-${field}`] = issue.message;
      } else if (first === "lines" && !second) {
        mapped.lines = issue.message;
      } else if (typeof first === "string") {
        mapped[first] = issue.message;
      }
    }
    setErrors(mapped);
    return false;
  }

  function handleSave(mode: "draft" | "send") {
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(mode);
    const input = {
      customerId,
      issueDate,
      dueDate,
      currency,
      discountPercent: discountPct,
      lines: lines.map((l) => ({
        description: l.description.trim(),
        quantity: Number(l.quantity),
        unitPrice: Number(l.unitPrice),
        taxRate: Number(l.taxRate),
      })),
      notes: notes.trim() || undefined,
    };

    const action = editing
      ? invoiceApi.update(editing.id, input).then(() => {
          if (mode === "send") return invoiceApi.send(editing.id);
        })
      : invoiceApi.create(input, mode).then((created) => {
          if (mode === "send") router.replace(`/dashboard/invoices/${created.id}`);
        });

    action
      .then(() => {
        toast.success(
          mode === "draft"
            ? editing
              ? "Draft updated"
              : `Draft saved — ${nextNumber}`
            : editing
              ? `${editing.number} sent to customer`
              : "Invoice created and sent"
        );
        if (mode === "draft") router.replace("/dashboard/invoices");
      })
      .catch(() => toast.error("Something went wrong"))
      .finally(() => setSaving(null));
  }

  return (
    <div>
      <PageHeading
        title={editing ? `Edit ${editing.number}` : "New Invoice"}
        subtitle={
          editing
            ? "Edits are only possible while the invoice is a draft"
            : `Next number in sequence: ${nextNumber}`
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft /> Back
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-0 p-0 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="text-sm font-bold text-text">Invoice details</div>
            {!editing && <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-[10.5px] font-bold text-text-3">{nextNumber}</span>}
          </div>

          <div className="flex flex-col gap-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Customer" error={errors.customerId}>
                <div className="flex gap-1.5">
                  <Select value={customerId} onValueChange={(v) => { setCustomerId(v ?? ""); setErrors({ ...errors, customerId: "" }); }}>
                    <SelectTrigger className={cn("w-full flex-1", errors.customerId && "border-red")}>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowAddCustomer(true)} aria-label="Add customer">
                    <UserPlus />
                  </Button>
                </div>
              </FormField>

              <FormField label="Currency" error={errors.currency}>
                <Select value={currency} onValueChange={(v) => { setCurrency((v ?? "AED") as Currency); setErrors({ ...errors, currency: "" }); }}>
                  <SelectTrigger className={cn("w-full")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["AED", "USD", "EUR", "GBP", "SAR"] as Currency[]).map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Issue date" error={errors.issueDate}>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => {
                    setIssueDate(e.target.value);
                    if (dueDate < e.target.value) setDueDate(e.target.value);
                  }}
                  aria-invalid={!!errors.issueDate}
                  className={cn(errors.issueDate && "border-red")}
                />
              </FormField>

              <FormField label="Due date" error={errors.dueDate}>
                <Input
                  type="date"
                  value={dueDate}
                  min={issueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  aria-invalid={!!errors.dueDate}
                  className={cn(errors.dueDate && "border-red")}
                />
              </FormField>
            </div>

            <div>
              <div className="mb-1.5 text-[11px] font-semibold text-text-2">Line items</div>
              {errors.lines && <p className="mb-1.5 text-[10.5px] text-red">{errors.lines}</p>}
              <LineItemsEditor lines={lines} onChange={setLines} errors={errors} />
            </div>

            <FormField label="Notes (printed on the invoice)" error={errors.notes}>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thank you for your business. Please transfer within the agreed payment terms."
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </FormField>

            <div className="rounded-lg border border-blue-t bg-blue-l p-3 text-[11.5px] text-blue">
              QR code will be auto-generated on the invoice PDF for easy payment scanning.
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="gap-0 p-0">
            <div className="border-b border-border px-5 py-3">
              <div className="text-sm font-bold text-text">Summary</div>
            </div>
            <div className="flex flex-col gap-2.5 px-5 py-4">
              <SummaryRow label="Subtotal" value={fmtMoney(totals.subtotal, currency)} />
              <label className="flex items-center justify-between gap-2 text-[13px] text-text-3">
                <span>Discount (%)</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={discountPercent}
                  onChange={(e) => {
                    setDiscountPercent(e.target.value);
                    setErrors({ ...errors, discountPercent: "" });
                  }}
                  aria-invalid={!!errors.discountPercent}
                  className={cn("w-20 text-right", errors.discountPercent && "border-red")}
                />
              </label>
              {errors.discountPercent && <p className="text-[10.5px] text-red">{errors.discountPercent}</p>}
              {discountPct > 0 && <SummaryRow label={`Discount applied (${discountPct}%)`} value={`−${fmtMoney(totals.discount, currency)}`} tone="red" />}
              <SummaryRow label="VAT" value={fmtMoney(totals.tax, currency)} />
              <SummaryRow label="Total" value={fmtMoney(totals.total, currency)} bold />
              <SummaryRow label="Paid" value={fmtMoney(editing?.paidAmount ?? 0, currency)} />
              <SummaryRow label="Balance due" value={fmtMoney((editing?.total ?? totals.total) - (editing?.paidAmount ?? 0), currency)} bold tone="red" />
            </div>
          </Card>

          <Card className="gap-0 border-blue-t bg-blue-l p-0">
            <div className="flex items-start gap-3 px-5 py-4">
              <FileText className="mt-0.5 size-4 shrink-0 text-blue" />
              <div className="text-[11.5px] leading-relaxed text-blue/90">
                Drafts stay private and are clearly labelled. Nothing is emailed until you click
                <strong> Create &amp; Send</strong>.
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-2">
            {!editing && (
              <Button variant="outline" onClick={() => setShowPreview(true)} disabled={totals.total <= 0}>
                <Eye /> Preview PDF
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => handleSave("draft")}
              disabled={saving !== null}
            >
              <Save /> {editing ? "Save Changes" : "Save Draft"}
            </Button>
            <Button
              onClick={() => handleSave("send")}
              disabled={saving !== null || Boolean(editing && editing.paidAmount > 0)}
            >
              <Send /> {editing ? "Send Invoice" : "Create & Send"}
            </Button>
            <Link href="/dashboard/invoices" className="text-center text-[11.5px] text-text-3 underline-offset-2 hover:underline">
              Cancel and go back
            </Link>
          </div>
        </div>
      </div>

      <InvoicePreviewDialog invoice={previewInvoice} open={showPreview} onOpenChange={setShowPreview} />
      <AddCustomerDialog
        open={showAddCustomer}
        onOpenChange={setShowAddCustomer}
        onCreated={(customer) => setCustomerId(customer.id)}
      />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "red";
}) {
  return (
    <div className={cn("flex justify-between text-[13px]", bold && "border-t-2 border-text pt-2 text-[15px] font-bold")}>
      <span className={cn(!bold && "text-text-3")}>{label}</span>
      <span className={cn(tone === "red" && "text-red", !tone && "text-text")}>{value}</span>
    </div>
  );
}