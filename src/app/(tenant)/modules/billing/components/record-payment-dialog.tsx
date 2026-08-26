"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { invoiceBalance, type Invoice, PAYMENT_METHOD_LABELS, round2, type PaymentMethod } from "../types";
import { recordPaymentSchema } from "../schemas";
import { invoiceApi } from "../api/invoices.service";
import { billingKeys } from "../query-keys";
import { FormField } from "./form-field";


export function RecordPaymentDialog({
  invoice,
  open,
  onOpenChange,
  onRecorded,
}: {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded?: () => void;
}) {
  const queryClient = useQueryClient();
  const balance = invoice ? invoiceBalance(invoice) : 0;
  const [form, setForm] = useState({
    amount: String(balance || ""),
    date: new Date().toISOString().slice(0, 10),
    method: "bank-transfer",
    reference: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function reset(inv: Invoice | null) {
    setForm({
      amount: inv ? String(invoiceBalance(inv)) : "",
      date: new Date().toISOString().slice(0, 10),
      method: "bank-transfer",
      reference: "",
    });
    setErrors({});
  }

  function handleSubmit() {
    if (!invoice) return;
    const result = recordPaymentSchema.safeParse(form);
    if (!result.success) {
      setErrors(
        Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]))
      );
      return;
    }

    const amount = round2(Number(result.data.amount));
    if (amount > balance + 0.005) {
      setErrors({ amount: `Amount exceeds the balance of ${fmtMoney(balance)}` });
      return;
    }

    setSaving(true);
    invoiceApi
      .recordPayment(invoice.id, {
        amount,
        date: result.data.date,
        method: result.data.method as PaymentMethod,
        reference: result.data.reference || undefined,
      })
      .then(() => {
        toast.success(amount >= balance - 0.005 ? `Invoice ${invoice.number} marked as paid` : `Payment of ${fmtMoney(amount)} recorded`);
        queryClient.invalidateQueries({ queryKey: billingKeys.invoices() });
        queryClient.invalidateQueries({ queryKey: billingKeys.invoice(invoice.id) });
        onOpenChange(false);
        onRecorded?.();
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Could not record payment"))
      .finally(() => setSaving(false));
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (next) reset(invoice); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            {invoice?.number} · Balance due {fmtMoney(balance)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <FormField label="Amount" error={errors.amount}>
            <Input
              type="number"
              min={0.01}
              step="any"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              aria-invalid={!!errors.amount}
              className={cn(errors.amount && "border-red")}
            />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Date" error={errors.date}>
              <Input
                type="date"
                value={form.date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                aria-invalid={!!errors.date}
                className={cn(errors.date && "border-red")}
              />
            </FormField>
            <FormField label="Method" error={errors.method}>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v ?? form.method })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* "retainer" is excluded — it's only ever set by retainersApi.drawForInvoice,
                      which also deducts the retainer's balance; picking it here wouldn't. */}
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[])
                    .filter((method) => method !== "retainer")
                    .map((method) => (
                      <SelectItem key={method} value={method}>
                        {PAYMENT_METHOD_LABELS[method]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <FormField label="Reference (optional)" error={errors.reference}>
            <Input
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="e.g. TRF-89001"
              aria-invalid={!!errors.reference}
              className={cn(errors.reference && "border-red")}
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || balance <= 0}>
            {saving ? "Recording..." : `Record ${fmtMoney(Number(form.amount) || 0)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
