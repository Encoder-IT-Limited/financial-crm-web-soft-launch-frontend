"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { retainerRefundSchema } from "../schemas";
import type { Retainer } from "../types";
import { retainersApi } from "../api/retainers.service";

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
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  function handleSubmit() {
    const result = retainerRefundSchema.safeParse({ reason });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    setSaving(true);
    retainersApi
      .requestRefund(retainer.id, result.data.reason)
      .then((ok) => {
        if (!ok) {
          toast.error("Refund failed — nothing left to refund");
          return;
        }
        toast.success(`Refund of ${fmtMoney(retainer.remainingBalance, retainer.currency)} issued as a credit note`);
        queryClient.invalidateQueries({ queryKey: ["retainers"] });
        queryClient.invalidateQueries({ queryKey: ["adjustments"] });
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        setReason("");
        onOpenChange(false);
      })
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
      <FormField label="Reason" error={error}>
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this being refunded?"
          className={cn(
            "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            error && "border-red"
          )}
        />
      </FormField>
    </FormDialog>
  );
}
