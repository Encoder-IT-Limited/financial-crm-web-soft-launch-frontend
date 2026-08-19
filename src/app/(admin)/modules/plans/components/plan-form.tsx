"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/shared/form-field";
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
};

type PlanFormProps = { mode: "create" } | { mode: "edit"; planId: string };

export function PlanForm(props: PlanFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<PlanFormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(props.mode === "edit");
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (props.mode !== "edit") return;
    planApi.get(props.planId).then((plan) => {
      if (!plan) {
        setNotFound(true);
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
      });
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode === "edit" ? props.planId : null]);

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
      if (props.mode === "create") {
        const plan = await planApi.create(result.data);
        toast.success(`${plan.name} plan created`);
      } else {
        await planApi.update(props.planId, result.data);
        toast.success(`${result.data.name} plan updated`);
      }
      router.push("/admin/plans");
    } finally {
      setSaving(false);
    }
  }

  if (props.mode === "edit" && loading) {
    return <Card className="p-6 text-[13px] text-text-4">Loading plan...</Card>;
  }

  if (props.mode === "edit" && notFound) {
    return (
      <Card className="p-6 text-[13px] text-text-4">
        Plan not found. <Link href="/admin/plans" className="text-blue hover:underline">Back to Plans &amp; Pricing</Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/plans" className="flex items-center gap-1.5 text-[12.5px] font-semibold text-text-3 hover:text-text">
        <ArrowLeft className="size-3.5" /> Back to Plans &amp; Pricing
      </Link>

      <Card className="flex flex-col gap-5 p-5 sm:p-6">
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
      </Card>

      <div className="flex justify-end gap-2">
        <Link href="/admin/plans">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "Saving..." : props.mode === "create" ? "Create plan" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
