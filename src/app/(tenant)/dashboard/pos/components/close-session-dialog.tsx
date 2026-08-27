"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { closeSessionSchema } from "../schemas";
import { expectedCashForSession, round2, type PosSession } from "../types";
import { posSessionsApi } from "../api/sessions.service";
import { posSalesApi } from "../api/sales.service";
import { FormField } from "../../../modules/billing/components/form-field";
import { useFmtMoney } from "../use-fmt-money";

export function CloseSessionDialog({
  session,
  open,
  onOpenChange,
  onClosed,
}: {
  session: PosSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClosed: () => void;
}) {
  const queryClient = useQueryClient();
  const money = useFmtMoney();
  const { data: sales = [] } = useQuery({ queryKey: ["pos-sales"], queryFn: () => posSalesApi.list(), enabled: open });
  const { data: refunds = [] } = useQuery({ queryKey: ["pos-refunds"], queryFn: () => posSalesApi.listRefunds(), enabled: open });

  const [counted, setCounted] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const expected = session ? expectedCashForSession(session, sales, refunds) : 0;
  const countedNumber = Number(counted) || 0;
  const variance = round2(countedNumber - expected);

  function reset() {
    setCounted("");
    setErrors({});
  }

  function handleSubmit() {
    if (!session) return;
    const result = closeSessionSchema.safeParse({ closingCashCounted: counted });
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message])));
      return;
    }
    setSaving(true);
    posSessionsApi
      .close(session.id, result.data.closingCashCounted)
      .then(() => {
        toast.success("Session closed");
        queryClient.invalidateQueries({ queryKey: ["pos-open-session"] });
        queryClient.invalidateQueries({ queryKey: ["pos-sessions"] });
        onOpenChange(false);
        onClosed();
      })
      .finally(() => setSaving(false));
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (next) reset(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>End Shift</DialogTitle>
          <DialogDescription>Count the cash in the drawer and enter it below.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="rounded-lg bg-surface-subtle p-3 text-[12.5px] text-text-2">
            Expected cash: <span className="font-bold text-text">{money(expected)}</span>
          </div>

          <FormField label="Counted cash" error={errors.closingCashCounted}>
            <Input
              type="number"
              min={0}
              step="any"
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              aria-invalid={!!errors.closingCashCounted}
              className={cn(errors.closingCashCounted && "border-red")}
            />
          </FormField>

          {counted !== "" && (
            <div className={cn("text-[12.5px] font-semibold", variance === 0 ? "text-green" : variance > 0 ? "text-blue" : "text-red")}>
              Variance: {variance > 0 ? "+" : ""}
              {money(variance)}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Ending shift..." : "End Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
