"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Blocks the checkout UI until a shift is open on this terminal —
 * nothing below it renders until this gate passes. */
export function SessionRequiredGate({ onOpenSession }: { onOpenSession: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-16 text-center">
      <Lock className="size-8 text-text-4" />
      <div>
        <div className="text-[14px] font-bold text-text">No shift is open</div>
        <p className="mt-1 text-[12.5px] text-text-3">Log in and enter your starting cash to begin selling.</p>
      </div>
      <Button onClick={onOpenSession}>Start Shift</Button>
    </Card>
  );
}
