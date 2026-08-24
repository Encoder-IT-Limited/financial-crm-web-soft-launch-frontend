"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { fmtMoney } from "@/lib/format";
import { retainerTopUpSetupSchema } from "../schemas";
import type { Retainer } from "../types";
import type { RecurrenceFrequency } from "../recurring/types";
import { recurringApi } from "../api/recurring.service";

/** Sets up the recurring template that funds this retainer's periodic
 * top-up (Phase H2) — a thin, retainer-scoped front end over the same
 * RecurringTemplate engine Recurring Invoices already uses, not a new
 * scheduler (Key Decision #7). `billingPeriod` maps directly onto
 * `RecurrenceFrequency` since it's the same vocabulary minus "weekly". */
export function RetainerTopUpSetupDialog({
  open,
  onOpenChange,
  retainer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retainer: Retainer;
}) {
  const queryClient = useQueryClient();
  const [nextInvoiceDate, setNextInvoiceDate] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  function handleSubmit() {
    const result = retainerTopUpSetupSchema.safeParse({ nextInvoiceDate });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    setSaving(true);
    recurringApi
      .create({
        customerId: retainer.customerId,
        description: `Retainer top-up — ${retainer.number}`,
        currency: retainer.currency,
        amount: retainer.contractAmount,
        frequency: retainer.billingPeriod as RecurrenceFrequency,
        nextInvoiceDate: result.data.nextInvoiceDate,
        kind: "retainer-topup",
        retainerId: retainer.id,
      })
      .then(() => {
        toast.success(`Recurring top-up set up for ${retainer.number}`);
        queryClient.invalidateQueries({ queryKey: ["recurring-templates"] });
        setNextInvoiceDate("");
        onOpenChange(false);
      })
      .finally(() => setSaving(false));
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Set up recurring top-up — ${retainer.number}`}
      description={`Each cycle bills the customer ${fmtMoney(retainer.contractAmount, retainer.currency)} and adds it to the remaining balance — never resets what's already there. Fires only when you click "Generate Top-Up Now", same as Recurring Invoices.`}
      onSubmit={handleSubmit}
      submitLabel="Set up top-up"
      submitting={saving}
    >
      <FormField label="First top-up date" error={error}>
        <Input
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          value={nextInvoiceDate}
          onChange={(e) => setNextInvoiceDate(e.target.value)}
          aria-invalid={!!error}
          className={cn(error && "border-red")}
        />
      </FormField>
    </FormDialog>
  );
}
