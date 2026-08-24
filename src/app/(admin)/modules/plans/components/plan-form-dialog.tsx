"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/shared/form-field";
import { FormDialog } from "@/components/shared/form-dialog";
import { ModuleToggleGrid } from "@/components/shared/module-toggle-grid";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { planApi } from "../api/plans.service";
import { planSchema, type PlanFormValues } from "../schemas";

const EMPTY_FORM: PlanFormValues = {
  name: "",
  priceMonthly: 0,
  priceYearly: 0,
  baseSeats: 1,
  additionalSeatPrice: 0,
  trialDays: 14,
  modules: [],
  popular: false,
  minSeats: 1,
  maxSeats: undefined,
};

type PlanFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & ({ mode: "create" } | { mode: "edit"; planId: string });

export function PlanFormDialog(props: PlanFormDialogProps) {
  const { open, onOpenChange, mode } = props;
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PlanFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);

  // The parent only ever mounts this dialog while it's open, and fully
  // unmounts it on close (see plans-list.tsx), so a plain mount-effect is
  // enough to load the edit target — no reset branch needed for "create".
  useEffect(() => {
    if (mode !== "edit") return;
    planApi.get(props.planId).then((plan) => {
      if (!plan) {
        setLoading(false);
        return;
      }
      setForm({
        name: plan.name,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        baseSeats: plan.baseSeats,
        additionalSeatPrice: plan.additionalSeatPrice,
        trialDays: plan.trialDays,
        modules: plan.modules,
        popular: plan.popular ?? false,
        minSeats: plan.minSeats,
        maxSeats: plan.maxSeats,
      });
      setErrors({});
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode === "edit" ? props.planId : null]);

  function set<K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    const result = planSchema.safeParse(form);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message])));
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (mode === "create") {
        const plan = await planApi.create(result.data);
        toast.success(`${plan.name} plan created`);
      } else {
        await planApi.update(props.planId, result.data);
        toast.success(`${result.data.name} plan updated`);
      }
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["audit"] });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Create plan" : "Edit plan"}
      description={
        mode === "create"
          ? "Define pricing, seats, and module access for a new tier."
          : "Update pricing, seats, and module access."
      }
      onSubmit={handleSubmit}
      submitLabel={mode === "create" ? "Create plan" : "Save changes"}
      submitting={saving || loading}
      size="xl"
    >
      {loading ? (
        <div className="py-8 text-center text-[13px] text-text-4">Loading plan...</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Plan name" error={errors.name} className="sm:col-span-2">
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Growth"
                aria-invalid={!!errors.name}
                className={cn(errors.name && "border-red")}
              />
            </FormField>

            <FormField label="Monthly price (AED)" error={errors.priceMonthly}>
              <Input
                type="number"
                min={0}
                value={form.priceMonthly}
                onChange={(e) => set("priceMonthly", Number(e.target.value))}
                aria-invalid={!!errors.priceMonthly}
                className={cn(errors.priceMonthly && "border-red")}
              />
            </FormField>
            <FormField label="Yearly price (AED)" error={errors.priceYearly}>
              <Input
                type="number"
                min={0}
                value={form.priceYearly}
                onChange={(e) => set("priceYearly", Number(e.target.value))}
                aria-invalid={!!errors.priceYearly}
                className={cn(errors.priceYearly && "border-red")}
              />
            </FormField>

            <FormField label="Base seats" error={errors.baseSeats}>
              <Input
                type="number"
                min={1}
                value={form.baseSeats}
                onChange={(e) => set("baseSeats", Number(e.target.value))}
                aria-invalid={!!errors.baseSeats}
                className={cn(errors.baseSeats && "border-red")}
              />
            </FormField>
            <FormField label="Price per additional seat (AED)" error={errors.additionalSeatPrice}>
              <Input
                type="number"
                min={0}
                value={form.additionalSeatPrice}
                onChange={(e) => set("additionalSeatPrice", Number(e.target.value))}
                aria-invalid={!!errors.additionalSeatPrice}
                className={cn(errors.additionalSeatPrice && "border-red")}
              />
            </FormField>

            <FormField label="Minimum seats" error={errors.minSeats}>
              <Input
                type="number"
                min={1}
                value={form.minSeats}
                onChange={(e) => set("minSeats", Number(e.target.value))}
                aria-invalid={!!errors.minSeats}
                className={cn(errors.minSeats && "border-red")}
              />
            </FormField>
            <FormField label="Maximum seats" error={errors.maxSeats}>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={form.maxSeats ?? ""}
                  onChange={(e) => set("maxSeats", e.target.value === "" ? undefined : Number(e.target.value))}
                  disabled={form.maxSeats === undefined}
                  placeholder="Unlimited"
                  aria-invalid={!!errors.maxSeats}
                  className={cn("flex-1", errors.maxSeats && "border-red")}
                />
                <label htmlFor="plan-unlimited-seats" className="flex shrink-0 items-center gap-1.5 text-[11.5px] text-text-2">
                  <Checkbox
                    id="plan-unlimited-seats"
                    checked={form.maxSeats === undefined}
                    onCheckedChange={(checked) => set("maxSeats", checked === true ? undefined : form.minSeats)}
                  />
                  Unlimited
                </label>
              </div>
            </FormField>

            <FormField label="Free trial (days)" error={errors.trialDays}>
              <Input
                type="number"
                min={0}
                value={form.trialDays}
                onChange={(e) => set("trialDays", Number(e.target.value))}
                aria-invalid={!!errors.trialDays}
                className={cn(errors.trialDays && "border-red")}
              />
            </FormField>
            <div className="flex items-end pb-2">
              <label htmlFor="plan-popular" className="flex items-center gap-2.5 text-[12.5px] text-text-2">
                <Checkbox
                  id="plan-popular"
                  checked={form.popular}
                  onCheckedChange={(checked) => set("popular", checked === true)}
                />
                <Label htmlFor="plan-popular" className="cursor-pointer">
                  Mark as &quot;Most popular&quot; on the pricing page
                </Label>
              </label>
            </div>
          </div>

          <FormField label="Modules included" error={errors.modules}>
            <ModuleToggleGrid value={form.modules} onChange={(modules) => set("modules", modules)} />
          </FormField>
        </>
      )}
    </FormDialog>
  );
}
