"use client";

import { BellRing, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Customer } from "../../crm/types";
import type { InvoiceDisplayStatus } from "../types";

export type InvoiceFilters = {
  search: string;
  status: "all" | InvoiceDisplayStatus;
  customer: string;
};

export function InvoicesToolbar({
  filters,
  onFiltersChange,
  customers,
  filteredCount,
  totalCount,
}: {
  filters: InvoiceFilters;
  onFiltersChange: (filters: InvoiceFilters) => void;
  customers: Customer[];
  filteredCount: number;
  totalCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-4" />
        <Input
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          placeholder="Search invoices..."
          className="w-full pl-8 sm:w-60"
        />
      </div>
      <Select
        value={filters.status}
        onValueChange={(status) => onFiltersChange({ ...filters, status: (status ?? "all") as InvoiceFilters["status"] })}
      >
        <SelectTrigger size="sm">
          <SelectValue>
            {(v: InvoiceFilters["status"]) =>
              ({
                all: "All status",
                draft: "Draft",
                sent: "Sent",
                "partially-paid": "Partially Paid",
                paid: "Paid",
                overdue: "Overdue",
                cancelled: "Cancelled",
              })[v] ?? "All status"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All status</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="sent">Sent</SelectItem>
          <SelectItem value="partially-paid">Partially Paid</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.customer}
        onValueChange={(customer) => onFiltersChange({ ...filters, customer: customer ?? "all" })}
      >
        <SelectTrigger size="sm">
          <SelectValue>
            {(v: string | null) => (v === "all" || !v ? "All customers" : (customers.find((c) => c.id === v)?.name ?? "All customers"))}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All customers</SelectItem>
          {customers.map((customer) => (
            <SelectItem key={customer.id} value={customer.id}>
              {customer.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="ml-auto text-[11px] text-text-4">
        {filteredCount} of {totalCount} invoices
      </div>
    </div>
  );
}

export function InvoicesBulkBar({
  selectedCount,
  sendingReminders,
  reminderEligibleCount,
  onExportSelected,
  onSendReminders,
  onClear,
}: {
  selectedCount: number;
  sendingReminders: boolean;
  reminderEligibleCount: number;
  onExportSelected: () => void;
  onSendReminders: () => void;
  onClear: () => void;
}) {
  if (selectedCount === 0) return null;
  return (
    <div className="hidden items-center gap-2 border-b border-blue-t bg-blue-l px-3 py-2 lg:flex">
      <BellRing className="size-4 text-blue" />
      <span className="text-[12.5px] font-semibold text-blue">
        {selectedCount} invoice{selectedCount === 1 ? "" : "s"} selected
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="xs" onClick={onExportSelected}>
          <Download /> Export selected
        </Button>
        <Button
          variant="outline"
          size="xs"
          disabled={sendingReminders || reminderEligibleCount === 0}
          onClick={onSendReminders}
        >
          <BellRing /> {sendingReminders ? "Sending…" : "Send reminders"}
        </Button>
        <Button variant="ghost" size="xs" onClick={onClear}>
          Clear selection
        </Button>
      </div>
    </div>
  );
}
