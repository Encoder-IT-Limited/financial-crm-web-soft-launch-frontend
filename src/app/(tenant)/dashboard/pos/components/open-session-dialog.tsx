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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/errors";
import { openSessionSchema } from "../schemas";
import { posTerminalsApi } from "../api/terminals.service";
import { posSessionsApi } from "../api/sessions.service";
import { FormField } from "../../invoices/components/form-field";
import { useMe } from "@/hooks/useMe";

/** Starting a shift is also the cashier-login step — a name plus the
 * terminal's own access code, checked against that terminal's record.
 * Deliberately a different code from the manager-approval PIN used for
 * discounts/refunds: this one authorizes "I can work this terminal,"
 * that one authorizes "this specific risky action is approved."
 *
 * Terminal selection here also doubles as the "which device is this"
 * picker (POS-Implementation-Plan.md's device-remembered decision) —
 * the caller persists the chosen terminal locally so this defaults to
 * the same one next time, without a separate enrollment step. */
export function OpenSessionDialog({
  open,
  onOpenChange,
  defaultTerminalId,
  onOpened,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTerminalId?: string;
  onOpened: (terminalId: string) => void;
}) {
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { data: terminals = [] } = useQuery({ queryKey: ["pos-terminals"], queryFn: posTerminalsApi.list });
  const activeTerminals = terminals.filter((t) => t.status === "active");

  const [terminalId, setTerminalId] = useState(defaultTerminalId ?? "");
  const [cashierName, setCashierName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [openingCash, setOpeningCash] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function reset() {
    setCashierName(me?.name ?? "");
    setAccessCode("");
    setOpeningCash("0");
    setErrors({});
  }

  function handleSubmit() {
    const selectedTerminalId = terminalId || activeTerminals[0]?.id || "";
    const result = openSessionSchema.safeParse({ terminalId: selectedTerminalId, cashierName, accessCode, openingCash });
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message])));
      return;
    }

    const terminal = terminals.find((t) => t.id === result.data.terminalId);
    if (!terminal) {
      setErrors({ terminalId: "Select a terminal" });
      return;
    }

    setSaving(true);
    posSessionsApi
      .open({
        terminalId: terminal.id,
        openedBy: result.data.cashierName,
        openingCash: result.data.openingCash,
        accessCode: result.data.accessCode,
      })
      .then(() => {
        toast.success(`Shift started — welcome, ${result.data.cashierName}`);
        queryClient.invalidateQueries({ queryKey: ["pos-open-session"] });
        onOpened(terminal.id);
        onOpenChange(false);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Could not start shift";
        const code = err instanceof ApiError ? err.code : undefined;
        if (code === "INVALID_ACCESS_CODE") {
          setErrors({ accessCode: "Incorrect access code for this terminal" });
        } else {
          toast.error(message);
        }
      })
      .finally(() => setSaving(false));
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (next) reset(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Start Shift</DialogTitle>
          <DialogDescription>Log in to a terminal and count the cash in the drawer to begin.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <FormField label="Terminal" error={errors.terminalId}>
            <Select value={terminalId || activeTerminals[0]?.id} onValueChange={(v) => setTerminalId(v ?? terminalId)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a terminal" />
              </SelectTrigger>
              <SelectContent>
                {activeTerminals.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Your name" error={errors.cashierName}>
            <Input
              value={cashierName}
              onChange={(e) => setCashierName(e.target.value)}
              placeholder="e.g. Amir K."
              aria-invalid={!!errors.cashierName}
              className={cn(errors.cashierName && "border-red")}
            />
          </FormField>

          <FormField label="Terminal access code" error={errors.accessCode}>
            <Input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="••••"
              aria-invalid={!!errors.accessCode}
              className={cn(errors.accessCode && "border-red")}
            />
          </FormField>

          <FormField label="Opening cash" error={errors.openingCash}>
            <Input
              type="number"
              min={0}
              step="any"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              aria-invalid={!!errors.openingCash}
              className={cn(errors.openingCash && "border-red")}
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || activeTerminals.length === 0}>
            {saving ? "Starting..." : "Start Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
