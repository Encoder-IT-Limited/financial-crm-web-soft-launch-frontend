"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FormField } from "@/components/shared/form-field";
import { PageHeading } from "@/components/shared/page-heading";
import { useMe } from "@/hooks/useMe";
import { toast } from "@/lib/toast";
import { tenantSettingsApi } from "../api/tenant-settings.service";

type FormState = {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  address: string;
  taxNumber: string;
  currency: string;
};

const empty: FormState = {
  name: "",
  legalName: "",
  email: "",
  phone: "",
  address: "",
  taxNumber: "",
  currency: "",
};

export function TenantSettingsPage() {
  const queryClient = useQueryClient();
  const { data: me, isLoading } = useMe();
  const tenant = me?.tenant;
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    setForm({
      name: tenant.name ?? "",
      legalName: tenant.legalName ?? "",
      email: tenant.email ?? "",
      phone: tenant.phone ?? "",
      address: tenant.address ?? "",
      taxNumber: tenant.taxNumber ?? "",
      currency: tenant.currency ?? "",
    });
  }, [tenant]);

  function patch(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }
    setSaving(true);
    try {
      await tenantSettingsApi.updateProfile({
        name: form.name.trim(),
        legalName: form.legalName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        taxNumber: form.taxNumber.trim(),
        currency: form.currency.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Organization profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Settings"
        subtitle="Organization profile used on invoices and tenant records"
        actions={
          <Button size="sm" onClick={handleSave} disabled={saving || isLoading || !tenant}>
            {saving ? "Saving…" : "Save"}
          </Button>
        }
      />

      <Card className="max-w-xl p-5">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !tenant ? (
          <p className="py-8 text-center text-[13px] text-text-3">No tenant profile loaded.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <FormField label="Company name">
              <Input value={form.name} onChange={(e) => patch("name", e.target.value)} />
            </FormField>
            <FormField label="Legal name">
              <Input value={form.legalName} onChange={(e) => patch("legalName", e.target.value)} />
            </FormField>
            <FormField label="Subdomain" hint="Cannot be changed from Settings">
              <Input value={tenant.subdomain} disabled />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={form.email} onChange={(e) => patch("email", e.target.value)} />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={(e) => patch("phone", e.target.value)} />
            </FormField>
            <FormField label="Address">
              <Input value={form.address} onChange={(e) => patch("address", e.target.value)} />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Tax / TRN">
                <Input value={form.taxNumber} onChange={(e) => patch("taxNumber", e.target.value)} />
              </FormField>
              <FormField label="Currency">
                <Input value={form.currency} onChange={(e) => patch("currency", e.target.value)} />
              </FormField>
            </div>
            <FormField label="Plan" hint="Managed by subscription">
              <Input value={tenant.plan} disabled />
            </FormField>
          </div>
        )}
      </Card>
    </div>
  );
}
