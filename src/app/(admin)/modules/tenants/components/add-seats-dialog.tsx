"use client";

import { useState } from "react";
import { z } from "zod";
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
import { FormField } from "@/components/shared/form-field";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { tenantsApi } from "../api/tenants.service";

const addSeatsSchema = z.object({
  count: z.coerce.number().int().positive("Enter at least 1 seat"),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  tenantName: string;
};

export function AddSeatsDialog({ open, onOpenChange, tenantId, tenantName }: Props) {
  const [count, setCount] = useState("1");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  function handleSubmit() {
    const result = addSeatsSchema.safeParse({ count });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    setSaving(true);
    tenantsApi
      .addSeats(tenantId, result.data.count)
      .then(() => {
        toast.success(`${result.data.count} seat(s) added to ${tenantName}`);
        setCount("1");
        onOpenChange(false);
      })
      .finally(() => setSaving(false));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add seats</DialogTitle>
          <DialogDescription>Manually add purchased seats to {tenantName}&apos;s plan.</DialogDescription>
        </DialogHeader>

        <FormField label="Seats to add" error={error}>
          <Input
            type="number"
            min={1}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            aria-invalid={!!error}
            className={cn(error && "border-red")}
          />
        </FormField>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Adding..." : "Add seats"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
