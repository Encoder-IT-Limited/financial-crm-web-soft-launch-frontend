"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { retainerRefundSchema } from "../schemas";
import type { Retainer } from "../types";
import { retainersApi } from "../api/retainers.service";
import { billingKeys } from "../query-keys";

/** Approval-gated (Key Decision #9) — only rendered/reachable when the
 * caller has already checked `can(me, "retainer.approve")`. */
export function RetainerRefundDialog({
  open,
  onOpenChange,
  retainer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retainer: Retainer;
}) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState(String(retainer.remainingBalance));
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  function handleSubmit() {
    const result = retainerRefundSchema.safeParse({ reason, amount });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }
    const requested = Number(result.data.amount);
    if (requested > retainer.remainingBalance) {
      setError(`Cannot refund more than the remaining ${fmtMoney(retainer.remainingBalance, retainer.currency)}`);
      return;
    }
    setError(undefined);
    setSaving(true);
    retainersApi
      .requestRefund(retainer.id, result.data.reason, requested)
      .then(() => {
        toast.success(`Refund of ${fmtMoney(requested, retainer.currency)} issued as a credit note`);
        queryClient.invalidateQueries({ queryKey: billingKeys.retainers() });
        queryClient.invalidateQueries({ queryKey: billingKeys.adjustments() });
        queryClient.invalidateQueries({ queryKey: billingKeys.invoices() });
        setReason("");
        onOpenChange(false);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Refund failed"))
      .finally(() => setSaving(false));
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Refund — ${retainer.number}`}
      description={`Issues a credit note for the remaining balance (${fmtMoney(retainer.remainingBalance, retainer.currency)}) and converts it into a real negative-value invoice, same as any other credit note.`}
      onSubmit={handleSubmit}
      submitLabel="Issue refund"
      submitting={saving}
    >
      <FormField label={`Amount (${retainer.currency})`} error={error}>
        <Input
          type="number"
          min={0}
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={cn(error && "border-red")}
        />
      </FormField>
      <FormField label="Reason" error={error}>
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this being refunded?"
          className={cn(
            "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            error && "border-red",
          )}
        />
      </FormField>
    </FormDialog>
  );
}
