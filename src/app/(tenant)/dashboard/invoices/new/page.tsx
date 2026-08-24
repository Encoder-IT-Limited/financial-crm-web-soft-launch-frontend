"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, Save, Eye, UserPlus, FileText, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { invoiceFormSchema } from "../../../modules/billing/schemas";
import { computeTotals, type Currency, type Invoice } from "../../../modules/billing/types";
import { invoiceApi } from "../../../modules/billing/api/invoices.service";
import { retainersApi } from "../../../modules/billing/api/retainers.service";
import { customersApi } from "../../../modules/crm/api/customers.service";
import { LineItemsEditor, emptyLines, type LineDraft } from "../../../modules/billing/components/line-items-editor";
import { FormField } from "../../../modules/billing/components/form-field";
import { AddCustomerDialog } from "../../../modules/billing/components/add-customer-dialog";
import { InvoicePreviewDialog } from "../../../modules/billing/components/invoice-preview-dialog";
import { InvoiceSummaryCard, SummaryRow } from "../../../modules/billing/components/invoice-summary-card";
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
  const queryClient = useQueryClient();
  const editId = params.get("edit");

  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const { data: retainers = [] } = useQuery({ queryKey: ["retainers"], queryFn: retainersApi.list });
  const { data: nextNumber = "INV-····" } = useQuery({
    queryKey: ["invoice-next-number"],
    queryFn: invoiceApi.getNextNumber,
  });
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
  const [payFromRetainer, setPayFromRetainer] = useState(false);

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

  // Only offered on brand-new invoices — editing an existing (already-sent
  // or draft) invoice doesn't go through invoiceApi.create, so there's no
  // single "the invoice that was just made" to draw the retainer against.
  const activeRetainer = !editing
    ? retainers.find((r) => r.customerId === customerId && r.status === "active" && r.remainingBalance > 0)
    : undefined;

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

  // Offered even when the retainer doesn't fully cover the invoice — it
  // pays what it can and the rest stays owed as a normal partial payment
  // (Sales-Invoicing-Implementation-Plan.md Phase H1 / Key Decision #8).
  const canPayFromRetainer = Boolean(activeRetainer && totals.total > 0 && activeRetainer.remainingBalance > 0);
  const retainerCoversFully = Boolean(activeRetainer && totals.total <= activeRetainer.remainingBalance);

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
      source: editing?.source ?? "manual",
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

    // Only combined with "Create & Send" — pre-paying a draft doesn't make
    // sense, so the checkbox has no effect while saving as a draft.
    const drawRetainer = !editing && mode === "send" && canPayFromRetainer && payFromRetainer ? activeRetainer : undefined;

    const action = editing
      ? invoiceApi.update(editing.id, input).then(() => {
          if (mode === "send") return invoiceApi.send(editing.id);
        })
      : invoiceApi.create(input, mode).then(async (created) => {
          if (drawRetainer) {
            await retainersApi.drawForInvoice(drawRetainer.id, {
              id: created.id,
              number: created.number,
              total: created.total,
              issueDate: created.issueDate,
            });
          }
          if (mode === "send") router.replace(`/dashboard/invoices/${created.id}`);
          return created;
        });

    action
      .then((created) => {
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        queryClient.invalidateQueries({ queryKey: ["invoice-next-number"] });
        if (editing) queryClient.invalidateQueries({ queryKey: ["invoice", editing.id] });
        if (drawRetainer) queryClient.invalidateQueries({ queryKey: ["retainers"] });
        const invoiceNumber = editing ? editing.number : (created as Invoice | undefined)?.number ?? nextNumber;
        toast.success(
          drawRetainer
            ? retainerCoversFully
              ? `${invoiceNumber} created and paid from ${drawRetainer.number}`
              : `${invoiceNumber} created — partially paid from ${drawRetainer.number}, remainder still due`
            : mode === "draft"
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
          <InvoiceSummaryCard
            currency={currency}
            totals={totals}
            discountPercent={discountPercent}
            onDiscountPercentChange={(value) => {
              setDiscountPercent(value);
              setErrors({ ...errors, discountPercent: "" });
            }}
            discountError={errors.discountPercent}
            extraRows={
              <>
                <SummaryRow label="Paid" value={fmtMoney(editing?.paidAmount ?? 0, currency)} />
                <SummaryRow
                  label="Balance due"
                  value={fmtMoney((editing?.total ?? totals.total) - (editing?.paidAmount ?? 0), currency)}
                  bold
                  tone="red"
                />
              </>
            }
          />

          {activeRetainer && !editing && (
            <Card className="gap-0 p-0">
              <label className="flex cursor-pointer items-start gap-2.5 px-5 py-4">
                <Checkbox
                  checked={payFromRetainer && canPayFromRetainer}
                  onCheckedChange={(checked) => setPayFromRetainer(!!checked)}
                  disabled={!canPayFromRetainer}
                  className="mt-0.5"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-text">
                    <Wallet className="size-3.5 text-blue" /> Pay from {activeRetainer.number}
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-text-3">
                    {retainerCoversFully
                      ? `Draws ${fmtMoney(totals.total, currency)} from the ${fmtMoney(activeRetainer.remainingBalance, activeRetainer.currency)} remaining balance and marks this invoice paid on send. Only applies with "Create & Send".`
                      : `Only ${fmtMoney(activeRetainer.remainingBalance, activeRetainer.currency)} remains on this retainer — it'll cover part of this invoice as a partial payment; the rest stays owed normally. Only applies with "Create & Send".`}
                  </p>
                </div>
              </label>
            </Card>
          )}

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