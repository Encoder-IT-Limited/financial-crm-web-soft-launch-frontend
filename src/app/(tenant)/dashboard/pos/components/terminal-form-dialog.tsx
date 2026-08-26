"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { terminalFormSchema } from "../schemas";
import type { PosTerminal } from "../types";
import { posTerminalsApi } from "../api/terminals.service";
import { PRODUCT_LOOKUP_WAREHOUSES } from "../../invoices/mock/product-lookup-seed";
import { FormField } from "../../invoices/components/form-field";

const EMPTY = { name: "", code: "", warehouseId: "", accessCode: "" };

/** Admin-only config — creating/editing a terminal doesn't need a
 * permission check wired up yet (no real role hierarchy exists in the
 * mock identity layer), but it's deliberately kept off the checkout
 * screen itself and lives on its own admin page. The access code set
 * here is what a cashier enters to start a shift on this terminal
 * (see OpenSessionDialog) — separate from the manager-approval PIN. */
export function TerminalFormDialog({
  terminal,
  open,
  onOpenChange,
}: {
  terminal: PosTerminal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  // The edit dialog is conditionally mounted fresh per terminal (see
  // terminals-list.tsx), so this initial value is always correct on
  // mount; the create dialog stays mounted and resets via onOpenChange
  // below instead — same "reset on open" convention as every other
  // form dialog in this codebase (e.g. FulfillmentDialog).
  const [form, setForm] = useState(() =>
    terminal ? { name: terminal.name, code: terminal.code, warehouseId: terminal.warehouseId, accessCode: terminal.accessCode } : EMPTY
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function reset() {
    setForm(terminal ? { name: terminal.name, code: terminal.code, warehouseId: terminal.warehouseId, accessCode: terminal.accessCode } : EMPTY);
    setErrors({});
  }

  function handleSubmit() {
    const result = terminalFormSchema.safeParse(form);
    if (!result.success) {
      setErrors(Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message])));
      return;
    }
    setSaving(true);
    const action = terminal ? posTerminalsApi.update(terminal.id, result.data) : posTerminalsApi.create(result.data);
    action
      .then(() => {
        toast.success(terminal ? "Terminal updated" : "Terminal created");
        queryClient.invalidateQueries({ queryKey: ["pos-terminals"] });
        onOpenChange(false);
      })
      .finally(() => setSaving(false));
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (next) reset(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{terminal ? "Edit Terminal" : "New Terminal"}</DialogTitle>
          <DialogDescription>Every sale through this terminal deducts from its linked warehouse.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <FormField label="Name" error={errors.name}>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Front Counter"
              aria-invalid={!!errors.name}
              className={cn(errors.name && "border-red")}
            />
          </FormField>
          <FormField label="Code" error={errors.code}>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. POS-1"
              aria-invalid={!!errors.code}
              className={cn(errors.code && "border-red")}
            />
          </FormField>
          <FormField label="Linked warehouse" error={errors.warehouseId}>
            <Select value={form.warehouseId} onValueChange={(v) => setForm({ ...form, warehouseId: v ?? form.warehouseId })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a warehouse" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_LOOKUP_WAREHOUSES.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Access code" error={errors.accessCode}>
            <Input
              value={form.accessCode}
              onChange={(e) => setForm({ ...form, accessCode: e.target.value })}
              placeholder="Cashiers enter this to start a shift here"
              aria-invalid={!!errors.accessCode}
              className={cn(errors.accessCode && "border-red")}
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : terminal ? "Save Changes" : "Create Terminal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
