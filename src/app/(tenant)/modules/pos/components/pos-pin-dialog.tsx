"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PosKeypad } from "./pos-keypad";

export function PosPinDialog({
  open,
  title = "Manager approval",
  description = "Enter a manager PIN to continue this action.",
  error,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  description?: string;
  error?: string | null;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (pin: string) => void;
}) {
  const [pin, setPin] = useState("");

  function push(digit: string) {
    setPin((prev) => (prev + digit).replace(/\D/g, "").slice(0, 8));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[340px]" showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-l text-amber">
              <ShieldCheck className="size-4" />
            </span>
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-1.5 py-1" aria-label="PIN">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className={`size-3 rounded-full border ${
                i < pin.length ? "border-blue bg-blue" : "border-border bg-surface-subtle"
              }`}
            />
          ))}
        </div>
        {error && <p className="text-center text-[12px] font-medium text-red">{error}</p>}
        <PosKeypad
          disabled={pending}
          onDigit={push}
          onBackspace={() => setPin((p) => p.slice(0, -1))}
        />
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={pending || pin.length < 4} onClick={() => onConfirm(pin)}>
            {pending ? "Checking…" : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
