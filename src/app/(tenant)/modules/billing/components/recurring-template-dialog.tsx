"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { useTenantCurrency } from "@/lib/use-tenant-currency";
import { recurringTemplateSchema } from "../schemas";
import { FREQUENCY_LABELS, RECURRENCE_FREQUENCIES, type RecurringTemplate } from "../recurring/types";
import { useCustomers } from "../../crm/hooks/use-customers";
import { FormField } from "./form-field";
import { CurrencySelect } from "./currency-select";
import { Switch } from "@/components/ui/switch";
import type { Currency } from "../types";

function defaultNextDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 15);
  return date.toISOString().slice(0, 10);
}

export type RecurringTemplateValues = {
  customerId: string;
  description: string;
  currency: Currency;
  amount: number;
  frequency: RecurringTemplate["frequency"];
  nextInvoiceDate: string;
  autoSend?: boolean;
};

type RecurringTemplateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Parent remounts this while open so form seeds from `editing`. */
  editing?: RecurringTemplate | null;
  onSave: (values: RecurringTemplateValues) => void | Promise<void>;
};

export function RecurringTemplateDialog({ open, onOpenChange, editing, onSave }: RecurringTemplateDialogProps) {
  const { data: customers = [] } = useCustomers();
  const tenantCurrency = useTenantCurrency();

  const [customerId, setCustomerId] = useState(editing?.customerId ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [currency, setCurrency] = useState<Currency>(editing?.currency ?? tenantCurrency);
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [frequency, setFrequency] = useState<RecurringTemplate["frequency"]>(editing?.frequency ?? "monthly");
  const [nextInvoiceDate, setNextInvoiceDate] = useState(editing?.nextInvoiceDate ?? defaultNextDate());
  const [autoSend, setAutoSend] = useState(editing?.autoSend ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const parsed = recurringTemplateSchema.safeParse({
      customerId,
      description,
      currency,
      amount,
      frequency,
      nextInvoiceDate,
      autoSend,
    });
    if (!parsed.success) {
      const mapped: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "");
        if (field && !mapped[field]) mapped[field] = issue.message;
      }
      setErrors(mapped);
      return;
    }
    setSaving(true);
    try {
      await onSave(parsed.data);
      toast.success(editing ? `${editing.number} updated` : "Recurring template created");
      onOpenChange(false);
    } catch {
      // Parent surfaces the error toast
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${editing.number}` : "New Recurring Template"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Changes apply to the next billing cycle."
              : "Set up an invoice that automatically recreates on a schedule. Each cycle generates a draft for review."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <FormField label="Customer *" error={errors.customerId}>
            <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
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

          <FormField label="Description *" error={errors.description}>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly managed IT retainer"
              aria-invalid={!!errors.description}
              className={cn(errors.description && "border-red")}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Amount *" error={errors.amount}>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                aria-invalid={!!errors.amount}
                className={cn(errors.amount && "border-red")}
              />
            </FormField>
            <FormField label="Currency">
              <CurrencySelect value={currency} onChange={setCurrency} />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Frequency *">
              <Select value={frequency} onValueChange={(v) => setFrequency((v ?? "monthly") as RecurringTemplate["frequency"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_FREQUENCIES.map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {FREQUENCY_LABELS[freq]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Next billing date *" error={errors.nextInvoiceDate}>
              <Input
                type="date"
                value={nextInvoiceDate}
                onChange={(e) => setNextInvoiceDate(e.target.value)}
                aria-invalid={!!errors.nextInvoiceDate}
                className={cn(errors.nextInvoiceDate && "border-red")}
              />
            </FormField>
          </div>

          <label className="flex items-start gap-2.5 rounded-lg border border-border px-3 py-2.5">
            <Switch checked={autoSend} onCheckedChange={(checked) => setAutoSend(checked === true)} className="mt-0.5" />
            <span>
              <span className="block text-[13px] font-semibold text-text">Auto-send generated invoices</span>
              <span className="text-[11.5px] text-text-3">
                Email the invoice to the customer as soon as a cycle generates it, instead of leaving it as a draft.
              </span>
            </span>
          </label>

          {amount && Number(amount) > 0 && (
            <div className="rounded-lg bg-surface-subtle px-3 py-2 text-[11.5px] text-text-3">
              Generates <strong className="text-text-2">{fmtMoney(Number(amount), currency)}</strong> per{" "}
              {FREQUENCY_LABELS[frequency].toLowerCase()} cycle, starting {nextInvoiceDate}.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : editing ? "Save Changes" : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
