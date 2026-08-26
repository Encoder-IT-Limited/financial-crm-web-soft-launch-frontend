"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { useTenantCurrency } from "@/lib/use-tenant-currency";
import { retainerFormSchema, type RetainerFormValues } from "../schemas";
import type { RetainerBillingPeriod } from "../types";
import { retainersApi } from "../api/retainers.service";
import { useRetainers } from "../hooks/use-retainers";
import { useCustomers } from "../../crm/hooks/use-customers";
import { billingKeys } from "../query-keys";
import { CurrencySelect } from "./currency-select";

const BILLING_PERIODS: RetainerBillingPeriod[] = ["monthly", "quarterly", "yearly"];

export function RetainerFormDialog({
  open,
  onOpenChange,
  retainerId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retainerId?: string;
}) {
  // The parent only ever mounts one of these at a time (editId -> null before
  // opening for a different retainer, or the standalone "New Retainer"
  // instance), so a lazy initializer is enough to seed the form — same
  // pattern as CustomerEditDialog/TenantEditDialog, no reset effect needed.
  const queryClient = useQueryClient();
  const { data: customers = [] } = useCustomers();
  const { data: retainers = [] } = useRetainers();
  const retainer = retainerId ? retainers.find((r) => r.id === retainerId) : undefined;
  const editing = !!retainerId;
  const tenantCurrency = useTenantCurrency();

  const [form, setForm] = useState<RetainerFormValues>(() =>
    retainer
      ? {
          customerId: retainer.customerId,
          contractAmount: retainer.contractAmount,
          billingPeriod: retainer.billingPeriod,
          billingModel: retainer.billingModel,
          currency: retainer.currency,
          startDate: retainer.startDate.slice(0, 10),
          expiryDate: retainer.expiryDate?.slice(0, 10) ?? "",
          notes: retainer.notes ?? "",
        }
      : {
          customerId: "",
          contractAmount: 0,
          billingPeriod: "monthly",
          billingModel: "one-time",
          currency: tenantCurrency,
          startDate: new Date().toISOString().slice(0, 10),
          expiryDate: "",
          notes: "",
        }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setForm((current) => ({ ...current, currency: tenantCurrency }));
  }, [tenantCurrency, editing]);

  if (editing && !retainer) return null;

  function handleSubmit() {
    const result = retainerFormSchema.safeParse(form);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message])));
      return;
    }
    setSaving(true);
    const action = editing ? retainersApi.update(retainerId!, result.data) : retainersApi.create(result.data);
    action
      .then(() => {
        toast.success(editing ? "Retainer updated" : "Retainer created");
        queryClient.invalidateQueries({ queryKey: billingKeys.retainers() });
        onOpenChange(false);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Could not save retainer"))
      .finally(() => setSaving(false));
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `Edit ${retainer?.number}` : "New Retainer"}
      description="Track a customer's prepaid retainer contract and usage against it."
      onSubmit={handleSubmit}
      submitLabel={editing ? "Save changes" : "Create Retainer"}
      submitting={saving}
    >
      <FormField label="Customer" error={errors.customerId}>
        <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v ?? "" })}>
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

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label={`Contract amount (${form.currency})`} error={errors.contractAmount}>
          <Input
            type="number"
            min={0}
            step="any"
            value={form.contractAmount}
            onChange={(e) => setForm({ ...form, contractAmount: Number(e.target.value) })}
            aria-invalid={!!errors.contractAmount}
            className={cn(errors.contractAmount && "border-red")}
            disabled={editing}
          />
        </FormField>
        <FormField label="Billing period" error={errors.billingPeriod}>
          <Select value={form.billingPeriod} onValueChange={(v) => setForm({ ...form, billingPeriod: (v ?? "monthly") as RetainerBillingPeriod })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BILLING_PERIODS.map((period) => (
                <SelectItem key={period} value={period}>
                  {period[0].toUpperCase() + period.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField label="Contract type" error={errors.billingModel}>
        <Select
          value={form.billingModel}
          onValueChange={(v) => setForm({ ...form, billingModel: (v ?? "one-time") as RetainerFormValues["billingModel"] })}
          disabled={editing}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one-time">One-time — a single upfront payment, drawn down until it&apos;s gone</SelectItem>
            <SelectItem value="recurring">Recurring — tops back up to the contract amount every billing period</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Currency">
          <CurrencySelect
            value={form.currency}
            onChange={(currency) => setForm({ ...form, currency })}
            invalid={!!errors.currency}
          />
        </FormField>
        <FormField label="Start date" error={errors.startDate}>
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            aria-invalid={!!errors.startDate}
            className={cn(errors.startDate && "border-red")}
          />
        </FormField>
      </div>

      <FormField label="Contract end date (optional)" error={errors.expiryDate}>
        <Input
          type="date"
          value={form.expiryDate}
          onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
          aria-invalid={!!errors.expiryDate}
          className={cn(errors.expiryDate && "border-red")}
        />
      </FormField>

      <FormField label="Notes" error={errors.notes}>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Scope of the retainer contract..."
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </FormField>
    </FormDialog>
  );
}
