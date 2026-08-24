"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Currency } from "../types";
import type { Customer } from "../../../modules/crm/types";
import { LineItemsEditor, type LineDraft } from "./line-items-editor";
import { FormField } from "./form-field";

/** The main "Invoice details" card on the New/Edit Invoice page — customer,
 * currency, dates, line items, notes — extracted verbatim; behavior
 * unchanged. */
export function InvoiceDetailsCard({
  editing,
  nextNumber,
  customers,
  customerId,
  onCustomerIdChange,
  currency,
  onCurrencyChange,
  issueDate,
  onIssueDateChange,
  dueDate,
  onDueDateChange,
  lines,
  onLinesChange,
  notes,
  onNotesChange,
  errors,
}: {
  editing: boolean;
  nextNumber: string;
  customers: Customer[];
  customerId: string;
  onCustomerIdChange: (value: string) => void;
  currency: Currency;
  onCurrencyChange: (value: Currency) => void;
  issueDate: string;
  onIssueDateChange: (value: string) => void;
  dueDate: string;
  onDueDateChange: (value: string) => void;
  lines: LineDraft[];
  onLinesChange: (lines: LineDraft[]) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <Card className="gap-0 p-0 lg:col-span-2">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="text-sm font-bold text-text">Invoice details</div>
        {!editing && (
          <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-[10.5px] font-bold text-text-3">{nextNumber}</span>
        )}
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Customer" error={errors.customerId}>
            <div className="flex gap-1.5">
              <Select value={customerId} onValueChange={(v) => onCustomerIdChange(v ?? "")}>
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
            </div>
          </FormField>

          <FormField label="Currency" error={errors.currency}>
            <Select value={currency} onValueChange={(v) => onCurrencyChange((v ?? "AED") as Currency)}>
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
              onChange={(e) => onIssueDateChange(e.target.value)}
              aria-invalid={!!errors.issueDate}
              className={cn(errors.issueDate && "border-red")}
            />
          </FormField>

          <FormField label="Due date" error={errors.dueDate}>
            <Input
              type="date"
              value={dueDate}
              min={issueDate}
              onChange={(e) => onDueDateChange(e.target.value)}
              aria-invalid={!!errors.dueDate}
              className={cn(errors.dueDate && "border-red")}
            />
          </FormField>
        </div>

        <div>
          <div className="mb-1.5 text-[11px] font-semibold text-text-2">Line items</div>
          {errors.lines && <p className="mb-1.5 text-[10.5px] text-red">{errors.lines}</p>}
          <LineItemsEditor lines={lines} onChange={onLinesChange} errors={errors} />
        </div>

        <FormField label="Notes (printed on the invoice)" error={errors.notes}>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Thank you for your business. Please transfer within the agreed payment terms."
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </FormField>

        <div className="rounded-lg border border-blue-t bg-blue-l p-3 text-[11.5px] text-blue">
          QR code will be auto-generated on the invoice PDF for easy payment scanning.
        </div>
      </div>
    </Card>
  );
}
