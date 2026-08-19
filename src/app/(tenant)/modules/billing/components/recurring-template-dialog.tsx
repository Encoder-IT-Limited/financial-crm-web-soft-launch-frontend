"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { recurringTemplateSchema } from "../schemas";
import { FREQUENCY_LABELS, RECURRENCE_FREQUENCIES, type RecurringTemplate } from "../recurring/types";
import { useInvoicesStore } from "../store/invoices-store";
import { FormField } from "./form-field";
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
};

type RecurringTemplateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rendered only while open — the parent mounts this component fresh for
   *  each open, so the form initializes straight from `editing`. */
  editing?: RecurringTemplate | null;
  onSave: (values: RecurringTemplateValues) => void;
};

export function RecurringTemplateDialog({ open, onOpenChange, editing, onSave }: RecurringTemplateDialogProps) {
  const customers = useInvoicesStore((state) => state.customers);

  const [customerId, setCustomerId] = useState(editing?.customerId ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [currency, setCurrency] = useState<Currency>(editing?.currency ?? "AED");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [frequency, setFrequency] = useState<RecurringTemplate["frequency"]>(editing?.frequency ?? "monthly");
  const [nextInvoiceDate, setNextInvoiceDate] = useState(editing?.nextInvoiceDate ?? defaultNextDate());
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSave() {
    const parsed = recurringTemplateSchema.safeParse({
      customerId,
      description,
      currency,
      amount,
      frequency,
      nextInvoiceDate,
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
    onSave(parsed.data);
    toast.success(editing ? `${editing.number} updated` : "Recurring template created");
    onOpenChange(false);
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
              <Select value={currency} onValueChange={(v) => setCurrency((v ?? "AED") as Currency)}>
                <SelectTrigger className="w-full">
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
          <Button onClick={handleSave}>{editing ? "Save Changes" : "Create Template"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}