"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { ApiError } from "@/lib/api/errors";
import type { Warehouse } from "@/app/(tenant)/modules/inventory/types";
import type { PosDiscountRule, PosTerminal } from "../api/pos.service";
import { useCreateDiscountRule, useCreateTerminal, useSetManagerPin } from "../hooks/use-pos";
import { fmtMoney } from "@/lib/format";

export function PosSetupSheet({
  open,
  onOpenChange,
  terminals,
  warehouses,
  rules,
  canManage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  terminals: PosTerminal[];
  warehouses: Warehouse[];
  rules: PosDiscountRule[];
  canManage: boolean;
}) {
  const createTerminal = useCreateTerminal();
  const createRule = useCreateDiscountRule();
  const setPin = useSetManagerPin();
  const [name, setName] = useState("Front counter");
  const [code, setCode] = useState("POS-01");
  const [warehouseId, setWarehouseId] = useState("");
  const [ruleName, setRuleName] = useState("10% off");
  const [ruleValue, setRuleValue] = useState("10");
  const [pin, setPinValue] = useState("");
  const [currentPin, setCurrentPin] = useState("");

  async function addTerminal() {
    if (!warehouseId) {
      toast.error("Select a warehouse for this register");
      return;
    }
    try {
      await createTerminal.mutateAsync({
        name: name.trim() || "Terminal",
        code: code.trim() || "POS-01",
        warehouseId,
        accessCode: "1111",
      });
      toast.success("Register created");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not create register");
    }
  }

  async function addRule() {
    const value = Number(ruleValue);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter a valid discount value");
      return;
    }
    try {
      await createRule.mutateAsync({ name: ruleName.trim() || "Discount", type: "PERCENTAGE", value });
      toast.success("Discount rule saved");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not save rule");
    }
  }

  async function savePin() {
    if (!/^\d{4,8}$/.test(pin)) {
      toast.error("PIN must be 4–8 digits");
      return;
    }
    try {
      await setPin.mutateAsync({ pin, currentPin: currentPin || undefined });
      toast.success("Manager PIN updated");
      setPinValue("");
      setCurrentPin("");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not set PIN");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Register setup</SheetTitle>
          <SheetDescription>Terminals, preset discounts, and the manager PIN live here — not on the selling floor.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 pb-8">
          <section>
            <h3 className="mb-2 text-[12px] font-bold tracking-wide text-text-3 uppercase">Registers</h3>
            <ul className="mb-3 space-y-1.5">
              {terminals.length === 0 && <li className="text-[13px] text-text-3">None yet.</li>}
              {terminals.map((t) => (
                <li key={t.id} className="rounded-lg border border-border px-3 py-2 text-[13px] font-semibold">
                  {t.name} <span className="font-mono text-[11px] text-text-4">{t.code}</span>
                </li>
              ))}
            </ul>
            {canManage && (
              <div className="space-y-2 rounded-xl border border-dashed border-border p-3">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" />
                <Select value={warehouseId} onValueChange={(v) => setWarehouseId(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="w-full" disabled={createTerminal.isPending} onClick={addTerminal}>
                  Add register
                </Button>
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-[12px] font-bold tracking-wide text-text-3 uppercase">Preset discounts</h3>
            <ul className="mb-3 space-y-1.5">
              {rules.map((r) => (
                <li key={r.id} className="flex justify-between rounded-lg border border-border px-3 py-2 text-[13px]">
                  <span>{r.name}</span>
                  <span className="font-bold text-blue">
                    {r.type === "PERCENTAGE" ? `${Number(r.value)}%` : fmtMoney(Number(r.value))}
                  </span>
                </li>
              ))}
            </ul>
            {canManage && (
              <div className="flex gap-2">
                <Input value={ruleName} onChange={(e) => setRuleName(e.target.value)} placeholder="Name" />
                <Input value={ruleValue} onChange={(e) => setRuleValue(e.target.value)} placeholder="%" className="w-20" />
                <Button variant="outline" disabled={createRule.isPending} onClick={addRule}>
                  Add
                </Button>
              </div>
            )}
          </section>

          {canManage && (
            <section>
              <h3 className="mb-2 text-[12px] font-bold tracking-wide text-text-3 uppercase">Manager PIN</h3>
              <p className="mb-2 text-[12px] text-text-3">Required for refunds, voids, and override discounts once set.</p>
              <div className="space-y-2">
                <Label htmlFor="pos-current-pin">Current PIN (if replacing)</Label>
                <Input id="pos-current-pin" type="password" inputMode="numeric" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} />
                <Label htmlFor="pos-new-pin">New PIN</Label>
                <Input id="pos-new-pin" type="password" inputMode="numeric" value={pin} onChange={(e) => setPinValue(e.target.value)} />
                <Button className="w-full" disabled={setPin.isPending} onClick={savePin}>
                  Save PIN
                </Button>
              </div>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
