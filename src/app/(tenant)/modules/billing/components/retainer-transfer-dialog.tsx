"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import { fmtMoney } from "@/lib/format";
import { retainerTransferSchema } from "../schemas";
import type { Retainer } from "../types";
import { retainersApi } from "../api/retainers.service";
import { billingKeys } from "../query-keys";

export function RetainerTransferDialog({
  open,
  onOpenChange,
  retainer,
  candidates,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retainer: Retainer;
  /** Other active retainers for the same customer — the only valid destinations. */
  candidates: Retainer[];
}) {
  const queryClient = useQueryClient();
  const [toRetainerId, setToRetainerId] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  function handleSubmit() {
    const result = retainerTransferSchema.safeParse({ toRetainerId });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    setSaving(true);
    retainersApi
      .transfer(retainer.id, result.data.toRetainerId)
      .then(() => {
        toast.success(`${fmtMoney(retainer.remainingBalance, retainer.currency)} transferred out of ${retainer.number}`);
        queryClient.invalidateQueries({ queryKey: billingKeys.retainers() });
        setToRetainerId("");
        onOpenChange(false);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Transfer failed"))
      .finally(() => setSaving(false));
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Transfer balance — ${retainer.number}`}
      description={`Moves the full remaining balance (${fmtMoney(retainer.remainingBalance, retainer.currency)}) to another active retainer for this customer and closes ${retainer.number}.`}
      onSubmit={handleSubmit}
      submitLabel="Transfer balance"
      submitting={saving}
    >
      <FormField label="Destination retainer" error={error}>
        <Select value={toRetainerId} onValueChange={(v) => setToRetainerId(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a retainer">
              {(v: string | null) => {
                const c = candidates.find((x) => x.id === v);
                return c ? `${c.number} — ${fmtMoney(c.remainingBalance, c.currency)} remaining` : "Select a retainer";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {candidates.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.number} — {fmtMoney(c.remainingBalance, c.currency)} remaining
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {candidates.length === 0 && (
          <p className="text-[10.5px] text-text-4">No other active retainers for this customer to transfer into.</p>
        )}
      </FormField>
    </FormDialog>
  );
}
