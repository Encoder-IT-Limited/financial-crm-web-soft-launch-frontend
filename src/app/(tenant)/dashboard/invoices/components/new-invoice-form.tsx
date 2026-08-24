"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { fmtMoney } from "@/lib/format";
import { invoiceFormSchema } from "../schemas";
import { computeTotals, type Currency, type Invoice } from "../types";
import { invoiceApi } from "../api/invoices.service";
import { retainersApi } from "../api/retainers.service";
import { customersApi } from "../../../modules/crm/api/customers.service";
import { emptyLines, type LineDraft } from "./line-items-editor";
import { AddCustomerDialog } from "./add-customer-dialog";
import { InvoicePreviewDialog } from "./invoice-preview-dialog";
import { InvoiceSummaryCard, SummaryRow } from "./invoice-summary-card";
import { InvoiceDetailsCard } from "./invoice-details-card";
import { RetainerPayOption } from "./retainer-pay-option";
import { NewInvoiceActions } from "./new-invoice-actions";
import { PageHeading } from "@/components/shared/page-heading";

export function NewInvoiceForm() {
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
  const [warehouseId, setWarehouseId] = useState("");
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
      setWarehouseId(invoice.lines.find((l) => l.warehouseId)?.warehouseId ?? "");
      setLines(
        invoice.lines.map((l) => ({
          id: l.id,
          mode: l.productId ? "product" : "text",
          description: l.description,
          quantity: String(l.quantity),
          unitPrice: String(l.unitPrice),
          taxRate: String(l.taxRate),
          productId: l.productId,
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
        productId: l.mode === "product" ? l.productId : undefined,
        warehouseId: l.mode === "product" && l.productId ? warehouseId || undefined : undefined,
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
        subtitle={editing ? "Edits are only possible while the invoice is a draft" : `Next number in sequence: ${nextNumber}`}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft /> Back
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <InvoiceDetailsCard
          editing={!!editing}
          nextNumber={nextNumber}
          customers={customers}
          customerId={customerId}
          onCustomerIdChange={(v) => {
            setCustomerId(v);
            setErrors({ ...errors, customerId: "" });
          }}
          currency={currency}
          onCurrencyChange={(v) => {
            setCurrency(v);
            setErrors({ ...errors, currency: "" });
          }}
          issueDate={issueDate}
          onIssueDateChange={(value) => {
            setIssueDate(value);
            if (dueDate < value) setDueDate(value);
          }}
          dueDate={dueDate}
          onDueDateChange={setDueDate}
          warehouseId={warehouseId}
          onWarehouseIdChange={setWarehouseId}
          lines={lines}
          onLinesChange={setLines}
          notes={notes}
          onNotesChange={setNotes}
          errors={errors}
        />

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
            <RetainerPayOption
              retainer={activeRetainer}
              checked={payFromRetainer}
              canPay={canPayFromRetainer}
              onCheckedChange={setPayFromRetainer}
              retainerCoversFully={retainerCoversFully}
              total={totals.total}
              currency={currency}
            />
          )}

          <NewInvoiceActions
            editing={!!editing}
            total={totals.total}
            saving={saving}
            editingPaidAmount={editing?.paidAmount}
            onPreview={() => setShowPreview(true)}
            onSaveDraft={() => handleSave("draft")}
            onSend={() => handleSave("send")}
          />
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
