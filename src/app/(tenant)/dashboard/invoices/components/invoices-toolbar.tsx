"use client";

import { BellRing, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Customer } from "../../../modules/crm/types";
import type { InvoiceDisplayStatus } from "../types";

export type InvoiceFilters = {
  search: string;
  status: "all" | InvoiceDisplayStatus;
  customer: string;
};

/** Search/status/customer filter row + the bulk-selection action bar —
 * extracted verbatim from the Invoices list page; behavior unchanged. */
export function InvoicesToolbar({
  filters,
  onFiltersChange,
  customers,
  filteredCount,
  totalCount,
  selectedCount,
  onExportSelected,
  sendingReminders,
  reminderEligibleCount,
  onSendReminders,
  onClearSelection,
}: {
  filters: InvoiceFilters;
  onFiltersChange: (filters: InvoiceFilters) => void;
  customers: Customer[];
  filteredCount: number;
  totalCount: number;
  selectedCount: number;
  onExportSelected: () => void;
  sendingReminders: boolean;
  reminderEligibleCount: number;
  onSendReminders: () => void;
  onClearSelection: () => void;
}) {
  return (
    <>
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
            <SelectValue />
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
            <SelectValue />
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
        <div className="ml-auto text-[11.5px] text-text-4">
          {filteredCount} of {totalCount} invoices
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="hidden items-center gap-2 border-b border-blue-t bg-blue-l px-3 py-2 lg:flex">
          <BellRing className="size-4 text-blue" />
          <span className="text-[12px] font-semibold text-blue">
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
              <BellRing /> Send reminder
            </Button>
            <Button variant="ghost" size="xs" onClick={onClearSelection}>
              Clear selection
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
