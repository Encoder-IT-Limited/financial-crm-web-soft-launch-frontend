"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { customersApi } from "../../../modules/crm/api/customers.service";
import type { Customer } from "../../../modules/crm/types";
import { AddCustomerDialog } from "../../../modules/billing/components/add-customer-dialog";

/** Optional customer attach — reuses CRM's existing quick-create dialog
 * rather than a POS-specific one, matching the client's "basic customer
 * lookup/creation" requirement (nothing POS-specific about it). */
export function CustomerPickerInline({
  customerId,
  onChange,
}: {
  customerId: string | undefined;
  onChange: (customerId: string | undefined) => void;
}) {
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Select value={customerId ?? "none"} onValueChange={(v) => onChange(v === "none" ? undefined : (v ?? undefined))}>
        <SelectTrigger size="sm" className="flex-1">
          <SelectValue placeholder="Walk-in customer">
            {(v: string | null) => (v === "none" || !v ? "Walk-in customer" : (customers.find((c) => c.id === v)?.name ?? "Walk-in customer"))}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Walk-in customer</SelectItem>
          {customers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {customerId ? (
        <Button variant="ghost" size="icon-sm" onClick={() => onChange(undefined)} aria-label="Remove customer">
          <X />
        </Button>
      ) : (
        <Button variant="outline" size="icon-sm" onClick={() => setAddOpen(true)} aria-label="Add new customer">
          <UserPlus />
        </Button>
      )}

      <AddCustomerDialog open={addOpen} onOpenChange={setAddOpen} onCreated={(customer: Customer) => onChange(customer.id)} />
    </div>
  );
}
