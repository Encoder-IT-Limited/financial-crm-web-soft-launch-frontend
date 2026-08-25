"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";
import { isValidManagerPin } from "../schemas";

/** Reusable gate for the "risky" POS actions the client flagged as
 * needing approval — discount overrides, voids, refunds. Demo-only:
 * any 4-digit PIN passes, there's no real manager account hierarchy
 * yet in the mock identity layer (see POS-Implementation-Plan.md
 * Key Decision #5). */
export function ManagerPinDialog({
  open,
  onOpenChange,
  title = "Manager approval required",
  description = "Enter a manager PIN to continue.",
  onApproved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onApproved: (approvedBy: string) => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | undefined>();

  function reset() {
    setPin("");
    setError(undefined);
  }

  function handleSubmit() {
    if (!isValidManagerPin(pin)) {
      setError("Enter a 4-digit PIN");
      return;
    }
    onApproved("Manager (PIN)");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (next) reset(); }}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="••••"
          className={cn("text-center text-lg tracking-[0.5em]", error && "border-red")}
          aria-invalid={!!error}
        />
        {error && <p className="text-[11.5px] text-red">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Approve</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
