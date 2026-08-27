"use client";

import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Currency, Customer } from "../../../modules/billing/types";
import { LineItemsEditor, type LineDraft } from "../../../modules/billing/components/line-items-editor";
import { FormField } from "../../../modules/billing/components/form-field";
import { CurrencySelect } from "../../../modules/billing/components/currency-select";

export function ProposalDetailsCard({
  nextNumber,
  isEditing,
  customers,
  customerId,
  onCustomerIdChange,
  onAddCustomer,
  currency,
  onCurrencyChange,
  date,
  onDateChange,
  expiryDate,
  onExpiryDateChange,
  lines,
  onLinesChange,
  notes,
  onNotesChange,
  errors,
}: {
  nextNumber: string;
  isEditing: boolean;
  customers: Customer[];
  customerId: string;
  onCustomerIdChange: (id: string) => void;
  onAddCustomer: () => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  date: string;
  onDateChange: (value: string) => void;
  expiryDate: string;
  onExpiryDateChange: (value: string) => void;
  lines: LineDraft[];
  onLinesChange: (lines: LineDraft[]) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <Card className="gap-0 p-0 lg:col-span-2">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="text-sm font-bold text-text">Proposal details</div>
        {!isEditing && (
          <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-[10.5px] font-bold text-text-3">{nextNumber}</span>
        )}
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Customer" error={errors.customerId}>
            <div className="flex gap-1.5">
              <Select value={customerId} onValueChange={(v) => onCustomerIdChange(v ?? "")}>
                <SelectTrigger className={cn("w-full flex-1", errors.customerId && "border-red")}>
                  {/* Base UI's Select.Value doesn't auto-derive the label from the
                      matching Select.Item like Radix does — without this render
                      function it prints the raw value (the customer's id) instead
                      of the name. */}
                  <SelectValue placeholder="Select customer">
                    {(value: string | null) => customers.find((c) => c.id === value)?.name ?? "Select customer"}
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
              <Button type="button" variant="outline" size="icon" onClick={onAddCustomer} aria-label="Add customer">
                <UserPlus />
              </Button>
            </div>
          </FormField>

          <FormField label="Currency" error={errors.currency}>
            <CurrencySelect value={currency} onChange={onCurrencyChange} invalid={!!errors.currency} />
          </FormField>

          <FormField label="Date" error={errors.date}>
            <Input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              aria-invalid={!!errors.date}
              className={cn(errors.date && "border-red")}
            />
          </FormField>

          <FormField label="Expiry date" error={errors.expiryDate}>
            <Input
              type="date"
              value={expiryDate}
              min={date}
              onChange={(e) => onExpiryDateChange(e.target.value)}
              aria-invalid={!!errors.expiryDate}
              className={cn(errors.expiryDate && "border-red")}
            />
          </FormField>
        </div>

        <div>
          <div className="mb-1.5 text-[11px] font-semibold text-text-2">Line items</div>
          {errors.lines && <p className="mb-1.5 text-[10.5px] text-red">{errors.lines}</p>}
          <LineItemsEditor lines={lines} onChange={onLinesChange} errors={errors} currency={currency} />
        </div>

        <FormField label="Notes (printed on the proposal)" error={errors.notes}>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Terms, validity period, or scope notes for the customer."
            className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </FormField>
      </div>
    </Card>
  );
}
