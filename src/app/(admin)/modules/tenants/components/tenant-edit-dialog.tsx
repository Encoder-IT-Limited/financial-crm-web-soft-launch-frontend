"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { FormDialog } from "@/components/shared/form-dialog";
import { StatusBadge, type TenantStatus } from "@/components/shared/status-badge";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { planApi } from "../../plans/api/plans.service";
import { tenantsApi } from "../api/tenants.service";
import { tenantEditSchema, type TenantEditValues } from "../schemas";

export function TenantEditDialog({
  open,
  onOpenChange,
  tenantId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
}) {
  // The parent only ever mounts one of these at a time and fully unmounts it
  // (editId -> null) before opening it for a different tenant, so a lazy
  // initializer is enough to seed the form — no reset effect needed.
  const queryClient = useQueryClient();
  const { data: tenants = [] } = useQuery({ queryKey: ["tenants"], queryFn: tenantsApi.list });
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: planApi.list });
  const tenant = tenants.find((t) => t.id === tenantId);
  const [form, setForm] = useState<TenantEditValues>(() =>
    tenant
      ? {
          name: tenant.name,
          legalName: tenant.legalName,
          email: tenant.email,
          phone: tenant.phone,
          address: tenant.address,
          planId: tenant.planId,
          status: tenant.status,
          billingCycle: tenant.billingCycle,
          renewalDate: tenant.renewalDate.slice(0, 10),
          extraSeatsPurchased: tenant.extraSeatsPurchased,
        }
      : {
          name: "",
          legalName: "",
          email: "",
          phone: "",
          address: "",
          planId: "",
          status: "active",
          billingCycle: "monthly",
          renewalDate: "",
          extraSeatsPurchased: 0,
        }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (!tenant) return null;

  function set<K extends keyof TenantEditValues>(key: K, value: TenantEditValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    const result = tenantEditSchema.safeParse(form);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message])));
      return;
    }
    setErrors({});
    setSaving(true);
    tenantsApi
      .update(tenantId, result.data)
      .then(() => {
        toast.success(`${result.data.name} updated`);
        queryClient.invalidateQueries({ queryKey: ["tenants"] });
        queryClient.invalidateQueries({ queryKey: ["audit"] });
        onOpenChange(false);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Could not update tenant");
      })
      .finally(() => setSaving(false));
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit tenant"
      description={`Update ${tenant.name}'s basic account details.`}
      onSubmit={handleSubmit}
      submitting={saving}
    >
      <h4 className="text-[11px] font-bold uppercase tracking-wide text-text-4">Company</h4>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Display name" error={errors.name}>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            aria-invalid={!!errors.name}
            className={cn(errors.name && "border-red")}
          />
        </FormField>

        <FormField label="Legal name" error={errors.legalName}>
          <Input
            value={form.legalName}
            onChange={(e) => set("legalName", e.target.value)}
            aria-invalid={!!errors.legalName}
            className={cn(errors.legalName && "border-red")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Email" error={errors.email}>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={!!errors.email}
            className={cn(errors.email && "border-red")}
          />
        </FormField>

        <FormField label="Phone" error={errors.phone}>
          <Input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            aria-invalid={!!errors.phone}
            className={cn(errors.phone && "border-red")}
          />
        </FormField>
      </div>

      <FormField label="Address" error={errors.address}>
        <Input
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          aria-invalid={!!errors.address}
          className={cn(errors.address && "border-red")}
        />
      </FormField>

      <h4 className="mt-1 text-[11px] font-bold uppercase tracking-wide text-text-4">Subscription</h4>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Plan" error={errors.planId}>
          <Select value={form.planId} onValueChange={(v) => v && set("planId", v)}>
            <SelectTrigger className={cn("w-full", errors.planId && "border-red")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Status" error={errors.status}>
          <Select value={form.status} onValueChange={(v) => v && set("status", v as TenantStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["active", "read-only", "pending-deletion", "cancelled"] as TenantStatus[]).map((status) => (
                <SelectItem key={status} value={status}>
                  <StatusBadge status={status} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Billing cycle" error={errors.billingCycle}>
          <Select value={form.billingCycle} onValueChange={(v) => v && set("billingCycle", v as TenantEditValues["billingCycle"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Renewal date" error={errors.renewalDate}>
          <Input
            type="date"
            value={form.renewalDate}
            onChange={(e) => set("renewalDate", e.target.value)}
            aria-invalid={!!errors.renewalDate}
            className={cn(errors.renewalDate && "border-red")}
          />
        </FormField>
      </div>

      <FormField label="Extra seats purchased" error={errors.extraSeatsPurchased}>
        <Input
          type="number"
          min={0}
          value={form.extraSeatsPurchased}
          onChange={(e) => set("extraSeatsPurchased", Number(e.target.value))}
          aria-invalid={!!errors.extraSeatsPurchased}
          className={cn(errors.extraSeatsPurchased && "border-red")}
        />
      </FormField>
    </FormDialog>
  );
}
