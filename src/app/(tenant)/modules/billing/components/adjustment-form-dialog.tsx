"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { useTenantCurrency } from "@/lib/use-tenant-currency";
import { adjustmentFormSchema } from "../schemas";
import type { AdjustmentKind } from "../types";
import { useCustomers } from "../../crm/hooks/use-customers";
import { useInvoices } from "../hooks/use-invoices";
import { useProducts, useWarehouses } from "../../inventory/hooks/use-inventory";
import { adjustmentsApi } from "../api/adjustments.service";
import { billingKeys } from "../query-keys";

const NO_INVOICE = "none";

export function AdjustmentFormDialog({
  open,
  onOpenChange,
  kind,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: AdjustmentKind;
}) {
  const queryClient = useQueryClient();
  const tenantCurrency = useTenantCurrency();
  const { data: customers = [] } = useCustomers();
  const { data: invoices = [] } = useInvoices();
  const { data: warehouses = [] } = useWarehouses();
  const { data: products = [] } = useProducts();

  const [customerId, setCustomerId] = useState("");
  const [invoiceId, setInvoiceId] = useState(NO_INVOICE);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [linkedReturn, setLinkedReturn] = useState(false);
  const [warehouseId, setWarehouseId] = useState("");
  const [returnQtys, setReturnQtys] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const customerInvoices = invoices.filter((inv) => inv.customerId === customerId && inv.status !== "cancelled");
  const linkedInvoice = invoices.find((inv) => inv.id === invoiceId);
  const productLines = useMemo(
    () => (linkedInvoice?.lines ?? []).filter((l) => l.productId),
    [linkedInvoice],
  );
  const label = kind === "credit" ? "Credit Note" : "Debit Note";

  function reset() {
    setCustomerId("");
    setInvoiceId(NO_INVOICE);
    setAmount("");
    setReason("");
    setLinkedReturn(false);
    setWarehouseId("");
    setReturnQtys({});
    setErrors({});
  }

  function handleSubmit() {
    const returnItems =
      kind === "credit" && linkedReturn
        ? productLines
            .map((line) => ({
              productId: line.productId!,
              quantity: Number(returnQtys[line.id] || line.quantity),
            }))
            .filter((item) => item.quantity > 0)
        : undefined;

    const result = adjustmentFormSchema.safeParse({
      kind,
      customerId,
      invoiceId: invoiceId === NO_INVOICE ? undefined : invoiceId,
      amount,
      reason,
      currency: tenantCurrency,
      linkedReturn: kind === "credit" ? linkedReturn : false,
      warehouseId: linkedReturn ? warehouseId : undefined,
      returnItems,
    });
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message])));
      return;
    }
    setSaving(true);
    adjustmentsApi
      .create(result.data)
      .then((created) => {
        toast.success(`${created.number} issued`);
        queryClient.invalidateQueries({ queryKey: billingKeys.adjustments() });
        if (result.data.linkedReturn) {
          queryClient.invalidateQueries({ queryKey: ["inventory"] });
        }
        reset();
        onOpenChange(false);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Could not issue note"))
      .finally(() => setSaving(false));
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      title={`New ${label}`}
      description={
        kind === "credit"
          ? "Reduces what the customer owes — issued for refunds, returns, or goodwill adjustments."
          : "Increases what the customer owes — issued for extra charges not on the original invoice."
      }
      onSubmit={handleSubmit}
      submitLabel={`Issue ${label}`}
      submitting={saving}
    >
      <FormField label="Customer" error={errors.customerId}>
        <Select
          value={customerId}
          onValueChange={(v) => {
            setCustomerId(v ?? "");
            setInvoiceId(NO_INVOICE);
            setErrors({ ...errors, customerId: "" });
          }}
        >
          <SelectTrigger className={cn("w-full", errors.customerId && "border-red")}>
            <SelectValue placeholder="Select customer">
              {(v: string | null) => customers.find((c) => c.id === v)?.name ?? "Select customer"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label="Linked invoice (optional)">
        <Select value={invoiceId} onValueChange={(v) => setInvoiceId(v ?? NO_INVOICE)} disabled={!customerId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={customerId ? "No linked invoice" : "Select a customer first"}>
              {(v: string | null) =>
                !v || v === NO_INVOICE
                  ? "No linked invoice"
                  : (customerInvoices.find((inv) => inv.id === v)?.number ?? "No linked invoice")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_INVOICE}>No linked invoice</SelectItem>
            {customerInvoices.map((invoice) => (
              <SelectItem key={invoice.id} value={invoice.id}>
                {invoice.number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>

      <FormField label={`Amount (${tenantCurrency})`} error={errors.amount}>
        <Input
          type="number"
          min={0}
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={!!errors.amount}
          className={cn(errors.amount && "border-red")}
        />
      </FormField>

      <FormField label="Reason" error={errors.reason}>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={kind === "credit" ? "e.g. Damaged goods, goodwill credit..." : "e.g. Additional charges not on the original invoice..."}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </FormField>

      {kind === "credit" && (
        <>
          <label className="flex items-start gap-2.5 rounded-lg border border-border px-3 py-2.5">
            <Checkbox
              checked={linkedReturn}
              onCheckedChange={(v) => setLinkedReturn(!!v)}
              className="mt-0.5"
            />
            <span>
              <span className="block text-[13px] font-semibold text-text">Physical return — restock inventory</span>
              <span className="text-[11px] text-text-3">
                Restocks the warehouse when this credit note is issued. Requires a warehouse and return quantities.
              </span>
            </span>
          </label>

          {linkedReturn && (
            <>
              <FormField label="Return warehouse" error={errors.warehouseId}>
                <Select value={warehouseId} onValueChange={(v) => setWarehouseId(v ?? "")}>
                  <SelectTrigger className={cn("w-full", errors.warehouseId && "border-red")}>
                    <SelectValue placeholder="Select warehouse">
                      {(v: string | null) => warehouses.find((w) => w.id === v)?.name ?? "Select warehouse"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses
                      .filter((w) => w.status === "active")
                      .map((wh) => (
                        <SelectItem key={wh.id} value={wh.id}>
                          {wh.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </FormField>

              {productLines.length > 0 ? (
                <FormField label="Return quantities" error={errors.returnItems}>
                  <div className="flex flex-col gap-2 rounded-lg border border-border p-2.5">
                    {productLines.map((line) => {
                      const product = products.find((p) => p.id === line.productId);
                      return (
                        <div key={line.id} className="flex items-center justify-between gap-3">
                          <span className="truncate text-[12.5px] text-text">
                            {product ? `${product.sku} — ${product.name}` : line.description}
                          </span>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            className="w-20 text-right"
                            value={returnQtys[line.id] ?? String(line.quantity)}
                            onChange={(e) => setReturnQtys({ ...returnQtys, [line.id]: e.target.value })}
                            aria-label={`Return qty for ${line.description}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </FormField>
              ) : (
                <p className="text-[11px] text-amber">
                  {invoiceId === NO_INVOICE
                    ? "Link an invoice that has product lines so we know what to restock."
                    : "This invoice has no product lines — restock needs a product-linked invoice."}
                </p>
              )}
            </>
          )}
        </>
      )}
    </FormDialog>
  );
}
