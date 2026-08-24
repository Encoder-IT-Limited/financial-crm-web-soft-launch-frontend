"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/form-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { customerEditSchema, type CustomerEditValues } from "../schemas";
import { CUSTOMER_STATUSES, type CustomerStatus } from "../types";
import { customersApi } from "../api/customers.service";
import { useCustomers } from "../hooks/use-customers";
import { crmKeys } from "../query-keys";
import { FormField } from "@/components/shared/form-field";

export function CustomerEditDialog({
  open,
  onOpenChange,
  customerId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
}) {
  // The parent only ever mounts one of these at a time and fully unmounts it
  // (editId -> null) before opening it for a different customer, so a lazy
  // initializer is enough to seed the form — no reset effect needed. The
  // customers list is already in the query cache (the list/detail page
  // that opens this dialog fetched it), so this read is instant.
  const queryClient = useQueryClient();
  const { data: customers = [] } = useCustomers();
  const customer = customers.find((c) => c.id === customerId);

  const [form, setForm] = useState<CustomerEditValues>(() =>
    customer
      ? {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          trn: customer.trn,
          creditLimit: customer.creditLimit,
          openingBalance: customer.openingBalance,
          status: customer.status,
        }
      : { name: "", email: "", phone: "", address: "", trn: "", creditLimit: 0, openingBalance: 0, status: "active" }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (!customer) return null;

  function handleSubmit() {
    const result = customerEditSchema.safeParse(form);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message])));
      return;
    }
    setSaving(true);
    customersApi
      .update(customerId, result.data)
      .then(() => {
        toast.success(`${result.data.name} updated`);
        queryClient.invalidateQueries({ queryKey: crmKeys.customers() });
        onOpenChange(false);
      })
      .finally(() => setSaving(false));
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Customer"
      description="Update contact details and financial settings."
      onSubmit={handleSubmit}
      submitting={saving}
      size="lg"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Company name" error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            aria-invalid={!!errors.name}
            className={cn(errors.name && "border-red")}
          />
        </FormField>
        <FormField label="TRN" error={errors.trn}>
          <Input
            value={form.trn}
            onChange={(e) => setForm({ ...form, trn: e.target.value })}
            aria-invalid={!!errors.trn}
            className={cn(errors.trn && "border-red")}
          />
        </FormField>
      </div>
      <FormField label="Email" error={errors.email}>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          aria-invalid={!!errors.email}
          className={cn(errors.email && "border-red")}
        />
      </FormField>
      <FormField label="Phone" error={errors.phone}>
        <Input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          aria-invalid={!!errors.phone}
          className={cn(errors.phone && "border-red")}
        />
      </FormField>
      <FormField label="Address" error={errors.address}>
        <Input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          aria-invalid={!!errors.address}
          className={cn(errors.address && "border-red")}
        />
      </FormField>
      <div className="grid gap-3 sm:grid-cols-3">
        <FormField label="Credit limit (AED)" error={errors.creditLimit}>
          <Input
            type="number"
            min={0}
            value={form.creditLimit}
            onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })}
            aria-invalid={!!errors.creditLimit}
            className={cn(errors.creditLimit && "border-red")}
          />
        </FormField>
        <FormField label="Opening balance (AED)" error={errors.openingBalance}>
          <Input
            type="number"
            min={0}
            value={form.openingBalance}
            onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })}
            aria-invalid={!!errors.openingBalance}
            className={cn(errors.openingBalance && "border-red")}
          />
        </FormField>
        <FormField label="Status">
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: (v ?? "active") as CustomerStatus })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CUSTOMER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "active" ? "Active" : "Inactive"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>
    </FormDialog>
  );
}
