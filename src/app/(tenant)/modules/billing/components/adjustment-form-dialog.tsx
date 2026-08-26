"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { adjustmentFormSchema } from "../schemas";
import type { AdjustmentKind } from "../types";
import { useCustomers } from "../../crm/hooks/use-customers";
import { useInvoices } from "../hooks/use-invoices";
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
  const { data: customers = [] } = useCustomers();
  const { data: invoices = [] } = useInvoices();

  const [customerId, setCustomerId] = useState("");
  const [invoiceId, setInvoiceId] = useState(NO_INVOICE);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const customerInvoices = invoices.filter((inv) => inv.customerId === customerId && inv.status !== "cancelled");
  const label = kind === "credit" ? "Credit Note" : "Debit Note";

  function reset() {
    setCustomerId("");
    setInvoiceId(NO_INVOICE);
    setAmount("");
    setReason("");
    setErrors({});
  }

  function handleSubmit() {
    const result = adjustmentFormSchema.safeParse({
      kind,
      customerId,
      invoiceId: invoiceId === NO_INVOICE ? undefined : invoiceId,
      amount,
      reason,
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
        reset();
        onOpenChange(false);
      })
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
      </FormField>

      <FormField label="Linked invoice (optional)">
        <Select value={invoiceId} onValueChange={(v) => setInvoiceId(v ?? NO_INVOICE)} disabled={!customerId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={customerId ? "No linked invoice" : "Select a customer first"} />
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

      <FormField label="Amount (AED)" error={errors.amount}>
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
    </FormDialog>
  );
}
