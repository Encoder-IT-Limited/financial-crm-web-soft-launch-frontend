"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { retainerRolloverSchema } from "../schemas";
import type { Retainer } from "../types";
import { retainersApi } from "../api/retainers.service";

export function RetainerRolloverDialog({
  open,
  onOpenChange,
  retainer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retainer: Retainer;
}) {
  const queryClient = useQueryClient();
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  function handleSubmit() {
    const result = retainerRolloverSchema.safeParse({ newExpiryDate });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    setSaving(true);
    retainersApi
      .rollOver(retainer.id, result.data.newExpiryDate)
      .then((created) => {
        if (!created) {
          toast.error("Roll over failed — this retainer isn't active");
          return;
        }
        toast.success(`Rolled over into new retainer ${created.number}`);
        queryClient.invalidateQueries({ queryKey: ["retainers"] });
        setNewExpiryDate("");
        onOpenChange(false);
      })
      .finally(() => setSaving(false));
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Roll over — ${retainer.number}`}
      description={`Closes ${retainer.number} and opens a new contract seeded with its remaining balance (${fmtMoney(retainer.remainingBalance, retainer.currency)}) — no new funding invoice, since that money is already accounted for.`}
      onSubmit={handleSubmit}
      submitLabel="Roll over"
      submitting={saving}
    >
      <FormField label="New contract end date" error={error}>
        <Input
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          value={newExpiryDate}
          onChange={(e) => setNewExpiryDate(e.target.value)}
          aria-invalid={!!error}
          className={cn(error && "border-red")}
        />
      </FormField>
    </FormDialog>
  );
}
