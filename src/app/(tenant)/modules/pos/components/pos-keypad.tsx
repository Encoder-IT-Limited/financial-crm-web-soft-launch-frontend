"use client";

import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0", "back"] as const;

export function PosKeypad({
  onDigit,
  onBackspace,
  className,
  disabled,
}: {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn("grid grid-cols-3 gap-1.5", className)}>
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          disabled={disabled}
          onClick={() => (key === "back" ? onBackspace() : onDigit(key))}
          className={cn(
            "flex h-12 items-center justify-center rounded-xl border border-border bg-surface text-[17px] font-semibold text-text transition-colors",
            "hover:bg-surface-subtle active:bg-blue-l active:text-blue",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40",
            "disabled:pointer-events-none disabled:opacity-40",
            key === "back" && "text-text-3",
          )}
        >
          {key === "back" ? <Delete className="size-5" /> : key}
        </button>
      ))}
    </div>
  );
}
