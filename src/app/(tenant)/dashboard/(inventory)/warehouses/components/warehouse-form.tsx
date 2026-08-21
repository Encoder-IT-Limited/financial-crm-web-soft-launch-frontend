"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
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

const toNumber = (value: unknown) =>
  typeof value === "string" ? (value.trim() === "" ? undefined : Number(value)) : value;

const warehouseSchema = z.object({
  name: z.string().trim().min(1, "Warehouse name is required"),
  location: z.string().trim().min(1, "Location is required"),
  manager: z.string().trim().min(1, "Manager name is required"),
  address: z.string().trim().min(1, "Address is required"),
  contactNumber: z.string().trim().min(1, "Contact number is required"),
  email: z.string().email("Enter a valid email"),
  capacity: z.preprocess(
    toNumber,
    z
      .number({ error: "Enter a valid capacity" })
      .int("Capacity must be a whole number")
      .min(1, "Capacity must be at least 1")
  ),
  status: z.enum(["active", "inactive"], { error: "Status is required" }),
});

type FormValues = {
  name: string;
  location: string;
  manager: string;
  address: string;
  contactNumber: string;
  email: string;
  capacity: string;
  status: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  name: "",
  location: "",
  manager: "",
  address: "",
  contactNumber: "",
  email: "",
  capacity: "",
  status: "active",
};

export function WarehouseForm() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  function setField<K extends keyof FormValues>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = warehouseSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormValues] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      // TODO: replace with warehousesApi.create once the inventory API exists.
      await new Promise((resolve) => setTimeout(resolve, 400));
      toast.success("Warehouse created", {
        description: `${result.data.name} was added to your warehouses.`,
      });
      router.push("/dashboard/warehouses");
    } catch {
      toast.error("Could not create the warehouse. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl p-5 min-[1440px]:p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Warehouse Name" error={errors.name}>
            <Input
              type="text"
              placeholder="e.g. Dubai Warehouse"
              value={values.name}
              onChange={(e) => setField("name", e.target.value)}
              aria-invalid={!!errors.name}
              className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
            />
          </FormField>

          <FormField label="Location (City / Area)" error={errors.location}>
            <Input
              type="text"
              placeholder="e.g. Dubai - Business Bay"
              value={values.location}
              onChange={(e) => setField("location", e.target.value)}
              aria-invalid={!!errors.location}
              className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
            />
          </FormField>
        </div>

        <FormField label="Address" error={errors.address}>
          <Input
            type="text"
            placeholder="Street, building number, city, UAE"
            value={values.address}
            onChange={(e) => setField("address", e.target.value)}
            aria-invalid={!!errors.address}
            className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Manager Name" error={errors.manager}>
            <Input
              type="text"
              placeholder="e.g. Sara Mansour"
              value={values.manager}
              onChange={(e) => setField("manager", e.target.value)}
              aria-invalid={!!errors.manager}
              className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
            />
          </FormField>

          <FormField label="Contact Number" error={errors.contactNumber}>
            <Input
              type="tel"
              placeholder="+971 4 000 0000"
              value={values.contactNumber}
              onChange={(e) => setField("contactNumber", e.target.value)}
              aria-invalid={!!errors.contactNumber}
              className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Email" error={errors.email}>
            <Input
              type="email"
              placeholder="warehouse@company.ae"
              value={values.email}
              onChange={(e) => setField("email", e.target.value)}
              aria-invalid={!!errors.email}
              className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
            />
          </FormField>

          <FormField label="Capacity (storage positions)" error={errors.capacity}>
            <Input
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 2500"
              value={values.capacity}
              onChange={(e) => setField("capacity", e.target.value)}
              aria-invalid={!!errors.capacity}
              className="h-9 border-border text-[12.5px] min-[1440px]:text-[13.5px]"
            />
          </FormField>
        </div>

        <FormField label="Status" error={errors.status} className="max-w-[calc(50%-0.5rem)] max-sm:max-w-none">
          <Select value={values.status} onValueChange={(value) => setField("status", value ?? "")}>
            <SelectTrigger
              aria-label="Status"
              className="h-9 w-full border-border text-[12.5px] min-[1440px]:text-[13.5px]"
            >
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <div className="mt-2 flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" render={<Link href="/dashboard/warehouses" />}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Warehouse"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
