"use client";

import { useEffect, useState } from "react";
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
import { ApiError } from "@/lib/api/errors";
import { FormField } from "../../invoices/components/form-field";
import { posTerminalsApi } from "../api/terminals.service";
import { isValidManagerPin } from "../schemas";

export function ManagerPinSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentPin, setCurrentPin] = useState("");
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrentPin("");
    setPin("");
  }, [open]);

  function handleSubmit() {
    if (!isValidManagerPin(pin)) {
      toast.error("New PIN must be 4–8 digits");
      return;
    }
    setSaving(true);
    posTerminalsApi
      .setManagerPin(pin, currentPin || undefined)
      .then(() => {
        toast.success("Manager PIN saved");
        onOpenChange(false);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof ApiError ? err.message : "Could not save manager PIN");
      })
      .finally(() => setSaving(false));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Manager PIN</DialogTitle>
          <DialogDescription>
            Required for refunds, voids, and override discounts. Leave current PIN blank if you have not set one yet.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <FormField label="Current PIN (if replacing)">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
            />
          </FormField>
          <FormField label="New PIN">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save PIN"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
