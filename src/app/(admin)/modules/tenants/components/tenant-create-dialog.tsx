"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { FormDialog } from "@/components/shared/form-dialog";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { planApi } from "../../plans/api/plans.service";
import { tenantsApi } from "../api/tenants.service";
import { tenantCreateSchema, type TenantCreateValues } from "../schemas";

const EMPTY: TenantCreateValues = {
  name: "",
  subdomain: "",
  ownerName: "",
  ownerEmail: "",
  ownerPassword: "",
  legalName: "",
  country: "",
  planId: "",
  billingCycle: "monthly",
};

export function TenantCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: plans = [] } = useQuery({ queryKey: ["plans"], queryFn: planApi.list });
  const [form, setForm] = useState<TenantCreateValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof TenantCreateValues>(key: K, value: TenantCreateValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    const result = tenantCreateSchema.safeParse({
      ...form,
      planId: form.planId || undefined,
      legalName: form.legalName || undefined,
      country: form.country || undefined,
    });
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message])));
      return;
    }
    setErrors({});
    setSaving(true);
    tenantsApi
      .create(result.data)
      .then((created) => {
        toast.success(`${created.name} created`);
        queryClient.invalidateQueries({ queryKey: ["tenants"] });
        queryClient.invalidateQueries({ queryKey: ["audit"] });
        onOpenChange(false);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Could not create tenant");
      })
      .finally(() => setSaving(false));
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="New tenant"
      description="Provision a company account and its owner login."
      onSubmit={handleSubmit}
      submitLabel="Create tenant"
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

        <FormField label="Subdomain" error={errors.subdomain}>
          <Input
            value={form.subdomain}
            onChange={(e) => set("subdomain", e.target.value.trim().toLowerCase())}
            placeholder="acme"
            aria-invalid={!!errors.subdomain}
            className={cn(errors.subdomain && "border-red")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Legal name" error={errors.legalName}>
          <Input value={form.legalName ?? ""} onChange={(e) => set("legalName", e.target.value)} />
        </FormField>
        <FormField label="Country" error={errors.country}>
          <Input value={form.country ?? ""} onChange={(e) => set("country", e.target.value)} placeholder="AE" />
        </FormField>
      </div>

      <h4 className="mt-1 text-[11px] font-bold uppercase tracking-wide text-text-4">Owner</h4>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Owner name" error={errors.ownerName}>
          <Input
            value={form.ownerName}
            onChange={(e) => set("ownerName", e.target.value)}
            aria-invalid={!!errors.ownerName}
            className={cn(errors.ownerName && "border-red")}
          />
        </FormField>
        <FormField label="Owner email" error={errors.ownerEmail}>
          <Input
            type="email"
            value={form.ownerEmail}
            onChange={(e) => set("ownerEmail", e.target.value)}
            aria-invalid={!!errors.ownerEmail}
            className={cn(errors.ownerEmail && "border-red")}
          />
        </FormField>
      </div>

      <FormField label="Owner password" error={errors.ownerPassword}>
        <Input
          type="password"
          value={form.ownerPassword}
          onChange={(e) => set("ownerPassword", e.target.value)}
          aria-invalid={!!errors.ownerPassword}
          className={cn(errors.ownerPassword && "border-red")}
        />
      </FormField>

      <h4 className="mt-1 text-[11px] font-bold uppercase tracking-wide text-text-4">Subscription</h4>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Plan" error={errors.planId}>
          <Select value={form.planId || "none"} onValueChange={(v) => set("planId", !v || v === "none" ? "" : v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="No plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No plan</SelectItem>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Billing cycle" error={errors.billingCycle}>
          <Select
            value={form.billingCycle}
            onValueChange={(v) => v && set("billingCycle", v as TenantCreateValues["billingCycle"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>
    </FormDialog>
  );
}
