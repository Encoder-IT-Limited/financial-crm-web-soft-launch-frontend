"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { useTenantCurrency } from "@/lib/use-tenant-currency";
import { invoiceFormSchema } from "../schemas";
import { computeTotals, type Invoice } from "../types";
import { invoiceApi } from "../api/invoices.service";
import { retainersApi } from "../api/retainers.service";
import { useCustomers } from "../../crm/hooks/use-customers";
import { billingKeys } from "../query-keys";
import { emptyLines, type LineDraft } from "./line-items-editor";
import { AddCustomerDialog } from "./add-customer-dialog";
import { InvoicePreviewDialog } from "./invoice-preview-dialog";
import { PageHeading } from "@/components/shared/page-heading";
import { NewInvoiceForm } from "./new-invoice-form";
import { NewInvoiceActions } from "./new-invoice-actions";

export function NewInvoicePage() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const editId = params.get("edit");

  const { data: customers = [] } = useCustomers();
  const { data: retainers = [] } = useQuery({ queryKey: billingKeys.retainers(), queryFn: retainersApi.list });
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingInvoiceLoading, setEditingInvoiceLoading] = useState(Boolean(editId));
  const { data: nextNumber = "INV-····" } = useQuery({
    queryKey: billingKeys.nextNumber(),
    queryFn: invoiceApi.getNextNumber,
  });
  const tenantCurrency = useTenantCurrency();
  const [customerId, setCustomerId] = useState("");
  const [currencyOverride, setCurrencyOverride] = useState<Invoice["currency"] | null>(null);
  const currency = currencyOverride ?? tenantCurrency;
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

  // Fetches directly rather than via useQuery + an effect reacting to its
  // data — setting several fields from a query result inside an effect
  // triggers React's "setState synchronously within an effect" warning.
  // Setting state inside this .then() callback is async (deferred past the
  // effect's own synchronous run), which doesn't trip that check — same
  // pattern already used by new-proposal-page.tsx for the same reason.
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    invoiceApi.get(editId).then((invoice) => {
      if (cancelled) return;
      if (!invoice || invoice.status !== "draft") {
        toast.error("Only draft invoices can be edited");
        router.replace("/dashboard/invoices");
        return;
      }
      setEditingInvoice(invoice);
      setCustomerId(invoice.customerId);
      setCurrencyOverride(invoice.currency);
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
          productId: l.productId,
          warehouseId: l.warehouseId,
          mode: l.productId ? "product" : "service",
        })),
      );
      setNotes(invoice.notes ?? "");
      setEditingInvoiceLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const activeRetainer = retainers.find(
    (r) => r.customerId === customerId && r.status === "active" && r.remainingBalance > 0,
  );

  const discountPct = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const totals = useMemo(
    () =>
      computeTotals(
        lines.map((l) => ({
          quantity: Number(l.quantity) || 0,
          unitPrice: Number(l.unitPrice) || 0,
          taxRate: Number(l.taxRate) || 0,
        })),
        discountPct,
      ),
    [lines, discountPct],
  );

  const canPayFromRetainer = Boolean(activeRetainer && totals.total > 0 && activeRetainer.remainingBalance > 0);
  const retainerCoversFully = Boolean(activeRetainer && totals.total <= activeRetainer.remainingBalance);

  const previewInvoice: Invoice = useMemo(
    () => ({
      id: "preview",
      number: nextNumber,
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
        productId: l.productId,
        warehouseId: l.warehouseId,
      })),
      subtotal: totals.subtotal,
      discountPercent: discountPct || undefined,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,
      paidAmount: 0,
      status: "draft",
      source: "manual",
      notes,
      createdBy: "Salma H.",
      createdAt: new Date().toISOString(),
      payments: [],
    }),
    [customers, customerId, currency, dueDate, issueDate, lines, nextNumber, notes, discountPct, totals],
  );

  if (editId && editingInvoiceLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-[13px] text-text-4">
        Loading invoice…
      </div>
    );
  }

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
        productId: l.productId,
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
      })),
      notes: notes.trim() || undefined,
    };

    const drawRetainer = mode === "send" && canPayFromRetainer && payFromRetainer ? activeRetainer : undefined;

    const savePromise = editId
      ? invoiceApi.update(editId, input).then(async (updated) => {
          if (mode === "send") {
            await invoiceApi.send(updated.id);
            return invoiceApi.get(updated.id) ?? updated;
          }
          return updated;
        })
      : invoiceApi.create(input, mode);

    savePromise
      .then(async (created) => {
        if (!created) {
          toast.error("Something went wrong");
          return;
        }
        if (drawRetainer) {
          await retainersApi.drawForInvoice(drawRetainer.id, {
            id: created.id,
            number: created.number,
            total: created.total,
            issueDate: created.issueDate,
          });
        }
        queryClient.invalidateQueries({ queryKey: billingKeys.invoices() });
        queryClient.invalidateQueries({ queryKey: billingKeys.nextNumber() });
        if (drawRetainer) queryClient.invalidateQueries({ queryKey: billingKeys.retainers() });
        if (editId) queryClient.invalidateQueries({ queryKey: billingKeys.invoice(editId) });
        const invoiceNumber = created.number ?? nextNumber;
        toast.success(
          drawRetainer
            ? retainerCoversFully
              ? `${invoiceNumber} created and paid from ${drawRetainer.number}`
              : `${invoiceNumber} created — partially paid from ${drawRetainer.number}, remainder still due`
            : mode === "draft"
              ? editId
                ? `${invoiceNumber} draft updated`
                : `Draft saved — ${invoiceNumber}`
              : editId
                ? `${invoiceNumber} updated and sent`
                : "Invoice created and sent",
        );
        if (mode === "send") router.replace(`/dashboard/invoices/${created.id}`);
        else router.replace(editId ? `/dashboard/invoices/${created.id}` : "/dashboard/invoices");
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Something went wrong"))
      .finally(() => setSaving(null));
  }

  return (
    <div>
      <PageHeading
        title={editId ? `Edit ${editingInvoice?.number ?? "Invoice"}` : "New Invoice"}
        subtitle={
          editId
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
        <NewInvoiceForm
          nextNumber={nextNumber}
          customers={customers}
          customerId={customerId}
          onCustomerIdChange={(id) => {
            setCustomerId(id);
            setErrors({ ...errors, customerId: "" });
          }}
          onAddCustomer={() => setShowAddCustomer(true)}
          currency={currency}
          onCurrencyChange={(value) => {
            setCurrencyOverride(value);
            setErrors({ ...errors, currency: "" });
          }}
          issueDate={issueDate}
          onIssueDateChange={(value) => {
            setIssueDate(value);
            if (dueDate < value) setDueDate(value);
          }}
          dueDate={dueDate}
          onDueDateChange={setDueDate}
          lines={lines}
          onLinesChange={setLines}
          notes={notes}
          onNotesChange={setNotes}
          errors={errors}
        />

        <NewInvoiceActions
          currency={currency}
          totals={totals}
          discountPercent={discountPercent}
          onDiscountPercentChange={(value) => {
            setDiscountPercent(value);
            setErrors({ ...errors, discountPercent: "" });
          }}
          discountError={errors.discountPercent}
          activeRetainer={activeRetainer}
          canPayFromRetainer={canPayFromRetainer}
          retainerCoversFully={retainerCoversFully}
          payFromRetainer={payFromRetainer}
          onPayFromRetainerChange={setPayFromRetainer}
          saving={saving}
          onPreview={() => setShowPreview(true)}
          onSaveDraft={() => handleSave("draft")}
          onSend={() => handleSave("send")}
        />
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
