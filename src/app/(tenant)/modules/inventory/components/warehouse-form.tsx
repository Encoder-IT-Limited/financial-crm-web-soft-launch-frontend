"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/shared/form-field";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { createWarehouseSchema } from "../schemas";
import { useCreateWarehouse } from "../hooks/use-inventory";

type FormValues = { name: string; code: string; address: string; status: string };
type FormErrors = Partial<Record<keyof FormValues, string>>;

export function WarehouseForm() {
  const [values, setValues] = useState<FormValues>({
    name: "",
    code: "",
    address: "",
    status: "active",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const router = useRouter();
  const createWarehouse = useCreateWarehouse();

  function setField<K extends keyof FormValues>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = createWarehouseSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    try {
      await createWarehouse.mutateAsync({
        name: result.data.name,
        code: result.data.code,
        address: result.data.address || undefined,
        status: result.data.status === "inactive" ? "INACTIVE" : "ACTIVE",
      });
      toast.success("Warehouse created");
      router.push("/dashboard/warehouses");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not create warehouse.");
    }
  }

  const inputClass = "h-9 border-border text-[12.5px]";

  return (
    <Card className="max-w-2xl p-5">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Warehouse Name" error={errors.name}>
            <Input className={inputClass} value={values.name} onChange={(e) => setField("name", e.target.value)} />
          </FormField>
          <FormField label="Code" error={errors.code} hint="Unique short code, e.g. DXB-01">
            <Input className={inputClass} value={values.code} onChange={(e) => setField("code", e.target.value)} />
          </FormField>
        </div>
        <FormField label="Address (optional)">
          <Input className={inputClass} value={values.address} onChange={(e) => setField("address", e.target.value)} />
        </FormField>
        <FormField label="Status">
          <Select value={values.status} onValueChange={(v) => setField("status", v ?? "active")}>
            <SelectTrigger className={`w-full max-w-xs ${inputClass}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <div className="mt-2 flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" render={<Link href="/dashboard/warehouses" />}>
            Cancel
          </Button>
          <Button type="submit" disabled={createWarehouse.isPending}>
            {createWarehouse.isPending ? "Creating..." : "Create Warehouse"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
