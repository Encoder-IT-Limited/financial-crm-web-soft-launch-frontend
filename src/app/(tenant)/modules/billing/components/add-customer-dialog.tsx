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
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { customerSchema, type CustomerValues } from "../../crm/schemas";
import type { Customer } from "../../crm/types";
import { customersApi } from "../../crm/api/customers.service";
import { FormField } from "./form-field";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (customer: Customer) => void;
};

export function AddCustomerDialog({ open, onOpenChange, onCreated }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CustomerValues>({ name: "", email: "", phone: "", address: "", trn: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function handleSubmit() {
    const result = customerSchema.safeParse(form);
    if (!result.success) {
      setErrors(
        Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]))
      );
      return;
    }
    setSaving(true);
    customersApi
      .create(result.data)
      .then((customer) => {
        toast.success(`${customer.name} added to CRM`);
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        setForm({ name: "", email: "", phone: "", address: "", trn: "" });
        setErrors({});
        onOpenChange(false);
        onCreated(customer);
      })
      .finally(() => setSaving(false));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
          <DialogDescription>New customer is added to your CRM and available on invoices.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Company name" error={errors.name}>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Emirates Group"
                aria-invalid={!!errors.name}
                className={cn(errors.name && "border-red")}
              />
            </FormField>
            <FormField label="TRN (if VAT registered)" error={errors.trn}>
              <Input
                value={form.trn}
                onChange={(e) => setForm({ ...form, trn: e.target.value })}
                placeholder="e.g. 100123456700001"
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
              placeholder="accounts@company.ae"
              aria-invalid={!!errors.email}
              className={cn(errors.email && "border-red")}
            />
          </FormField>
          <FormField label="Phone" error={errors.phone}>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+971 50 000 0000"
              aria-invalid={!!errors.phone}
              className={cn(errors.phone && "border-red")}
            />
          </FormField>
          <FormField label="Address" error={errors.address}>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Street, City, Country"
              aria-invalid={!!errors.address}
              className={cn(errors.address && "border-red")}
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Add Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}