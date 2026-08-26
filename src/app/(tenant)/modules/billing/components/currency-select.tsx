"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES, type Currency } from "@/app/(tenant)/modules/crm/types";
import { cn } from "@/lib/utils";

export function CurrencySelect({
  value,
  onChange,
  invalid,
  className,
}: {
  value: Currency;
  onChange: (value: Currency) => void;
  invalid?: boolean;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange((v ?? value) as Currency)}>
      <SelectTrigger className={cn("w-full", invalid && "border-red", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((code) => (
          <SelectItem key={code} value={code}>
            {code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
