"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { computeTotals } from "../types";

export type LineDraft = {
  id: string;
  description: string;
  quantity: string; // string-typed so the inputs stay freely editable while typing
  unitPrice: string;
  taxRate: string;
};

export type LineErrors = Record<string, string>;

export function newLine(): LineDraft {
  return { id: crypto.randomUUID(), description: "", quantity: "1", unitPrice: "", taxRate: "5" };
}

export function emptyLines(): LineDraft[] {
  return [newLine()];
}

export function lineTotals(lines: LineDraft[]) {
  return computeTotals(
    lines.map((l) => ({
      quantity: Number(l.quantity) || 0,
      unitPrice: Number(l.unitPrice) || 0,
      taxRate: Number(l.taxRate) || 0,
    }))
  );
}

export function LineItemsEditor({
  lines,
  onChange,
  errors,
}: {
  lines: LineDraft[];
  onChange: (lines: LineDraft[]) => void;
  errors?: LineErrors;
}) {
  const totals = lineTotals(lines);

  function update(id: string, patch: Partial<LineDraft>) {
    onChange(lines.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function remove(id: string) {
    onChange(lines.length > 1 ? lines.filter((line) => line.id !== id) : lines);
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-subtle text-left text-[10.5px] font-bold text-text-4">
              <th className="px-2 py-2 font-bold sm:px-3">Description</th>
              <th className="w-16 px-1 py-2 font-bold sm:px-2">Qty</th>
              <th className="w-28 px-1 py-2 font-bold sm:px-2">Unit price</th>
              <th className="w-20 px-1 py-2 font-bold sm:px-2">VAT</th>
              <th className="w-24 px-1 py-2 text-right font-bold sm:px-3">Total</th>
              <th className="w-9 px-1 py-2 sm:px-2" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const qty = Number(line.quantity) || 0;
              const price = Number(line.unitPrice) || 0;
              const total = qty * price;
              return (
                <tr key={line.id} className="border-t border-border">
                  <td className="px-2 py-1.5 sm:px-3">
                    <Input
                      value={line.description}
                      onChange={(e) => update(line.id, { description: e.target.value })}
                      placeholder="Description of goods / service"
                      aria-label="Description"
                      aria-invalid={!!errors?.[`${line.id}-description`]}
                      className={cn(errors?.[`${line.id}-description`] && "border-red")}
                    />
                    {errors?.[`${line.id}-description`] && (
                      <p className="mt-0.5 text-[10.5px] text-red">{errors[`${line.id}-description`]}</p>
                    )}
                  </td>
                  <td className="px-1 py-1.5 sm:px-2">
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={line.quantity}
                      onChange={(e) => update(line.id, { quantity: e.target.value })}
                      aria-label="Quantity"
                      aria-invalid={!!errors?.[`${line.id}-quantity`]}
                      className={cn("text-right", errors?.[`${line.id}-quantity`] && "border-red")}
                    />
                  </td>
                  <td className="px-1 py-1.5 sm:px-2">
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={line.unitPrice}
                      onChange={(e) => update(line.id, { unitPrice: e.target.value })}
                      aria-label="Unit price"
                      aria-invalid={!!errors?.[`${line.id}-unitPrice`]}
                      className={cn("text-right", errors?.[`${line.id}-unitPrice`] && "border-red")}
                    />
                  </td>
                  <td className="px-1 py-1.5 sm:px-2">
                    <Select value={line.taxRate} onValueChange={(v) => update(line.id, { taxRate: v ?? line.taxRate })}>
                      <SelectTrigger size="sm" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-1 py-1.5 text-right text-[13px] font-semibold text-text sm:px-3">
                    {fmtMoney(total)}
                  </td>
                  <td className="px-1 py-1.5 sm:px-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-red"
                      onClick={() => remove(line.id)}
                      aria-label="Remove line"
                    >
                      <Trash2 />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" size="sm" onClick={() => onChange([...lines, newLine()])}>
          <Plus /> Add line
        </Button>

        <div className="flex flex-col items-end gap-1">
          <div className="flex w-full justify-between gap-10 text-[13px] sm:w-auto">
            <span className="text-text-3">Subtotal</span>
            <span className="font-medium text-text">{fmtMoney(totals.subtotal)}</span>
          </div>
          <div className="flex w-full justify-between gap-10 text-[13px] sm:w-auto">
            <span className="text-text-3">VAT</span>
            <span className="font-medium text-text">{fmtMoney(totals.tax)}</span>
          </div>
          <div className="flex w-full justify-between gap-10 border-t-2 border-text pt-1.5 text-[15px] font-bold sm:w-auto">
            <span>Total</span>
            <span className="text-blue">{fmtMoney(totals.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}