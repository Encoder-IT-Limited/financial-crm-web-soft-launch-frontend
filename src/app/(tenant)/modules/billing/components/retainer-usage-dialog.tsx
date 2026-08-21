"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { recordUsageSchema } from "../schemas";
import type { Retainer } from "../types";
import { retainersApi } from "../api/retainers.service";

export function RetainerUsageDialog({
  open,
  onOpenChange,
  retainer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retainer: Retainer;
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function reset() {
    setAmount("");
    setDate(new Date().toISOString().slice(0, 10));
    setNote("");
    setErrors({});
  }

  function handleSubmit() {
    const result = recordUsageSchema.safeParse({ amount, date, note });
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message])));
      return;
    }
    if (result.data.amount > retainer.remainingBalance) {
      setErrors({ amount: `Exceeds remaining balance of ${fmtMoney(retainer.remainingBalance, retainer.currency)}` });
      return;
    }
    setSaving(true);
    retainersApi
      .recordUsage(retainer.id, result.data)
      .then(() => {
        toast.success(`Usage of ${fmtMoney(result.data.amount, retainer.currency)} recorded against ${retainer.number}`);
        queryClient.invalidateQueries({ queryKey: ["retainers"] });
        reset();
        onOpenChange(false);
      })
      .finally(() => setSaving(false));
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      title={`Record Usage — ${retainer.number}`}
      description={`Remaining balance: ${fmtMoney(retainer.remainingBalance, retainer.currency)}`}
      onSubmit={handleSubmit}
      submitLabel="Record Usage"
      submitting={saving}
    >
      <FormField label="Amount used" error={errors.amount}>
        <Input
          type="number"
          min={0}
          max={retainer.remainingBalance}
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={!!errors.amount}
          className={cn(errors.amount && "border-red")}
        />
      </FormField>
      <FormField label="Date" error={errors.date}>
        <Input
          type="date"
          value={date}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDate(e.target.value)}
          aria-invalid={!!errors.date}
          className={cn(errors.date && "border-red")}
        />
      </FormField>
      <FormField label="Note" error={errors.note}>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was this usage for?" />
      </FormField>
    </FormDialog>
  );
}
