"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/shared/page-heading";
import { FilterableTable } from "@/components/shared/filterable-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { fmtMoney } from "@/lib/format";
import { useInvoices } from "../../billing/hooks/use-invoices";
import { invoiceBalance } from "../../billing/types";
import { AddCustomerDialog } from "../../billing/components/add-customer-dialog";
import { customersApi } from "../api/customers.service";
import { useCustomers } from "../hooks/use-customers";
import { crmKeys } from "../query-keys";
import { CUSTOMER_STATUSES, type Customer, type CustomerStatus } from "../types";
import { CustomerStatusBadge } from "./customer-status-badge";
import { CustomerEditDialog } from "./customer-edit-dialog";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyColumnDef<TData> = ColumnDef<TData, any>;

type Filters = { search: string; status: "all" | CustomerStatus };

export function CustomersList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: customers = [], isLoading: loading } = useCustomers();
  const { data: invoices = [] } = useInvoices();
  const [filters, setFilters] = useState<Filters>({ search: "", status: "all" });

  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteCustomer = customers.find((c) => c.id === deleteId);

  const outstandingByCustomer = useMemo(() => {
    const map = new Map<string, number>();
    for (const inv of invoices) {
      if (inv.status === "cancelled") continue;
      map.set(inv.customerId, (map.get(inv.customerId) ?? 0) + invoiceBalance(inv));
    }
    return map;
  }, [invoices]);

  const filtered = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    return customers.filter((customer) => {
      if (filters.status !== "all" && customer.status !== filters.status) return false;
      if (
        needle &&
        !customer.name.toLowerCase().includes(needle) &&
        !customer.customerCode.toLowerCase().includes(needle) &&
        !customer.email.toLowerCase().includes(needle)
      )
        return false;
      return true;
    });
  }, [customers, filters]);

  const columns = useMemo<AnyColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-text">{row.original.name}</div>
            <div className="text-[11px] text-text-4">{row.original.customerCode}</div>
          </div>
        ),
      },
      {
        id: "contact",
        header: "Contact",
        enableSorting: false,
        cell: ({ row }) => (
          <div>
            <div className="text-[12.5px] text-text-2 min-[1440px]:text-[13.5px]">{row.original.email}</div>
            <div className="text-[11px] text-text-4">{row.original.phone}</div>
          </div>
        ),
      },
      {
        id: "outstanding",
        header: "Outstanding",
        cell: ({ row }) => {
          const balance = outstandingByCustomer.get(row.original.id) ?? 0;
          return (
            <span className={balance > 0 ? "font-semibold text-amber" : "text-text-3"}>
              {fmtMoney(balance, row.original.currency)}
            </span>
          );
        },
      },
      {
        id: "creditLimit",
        header: "Credit Limit",
        cell: ({ row }) => (
          <span className="text-[12.5px] text-text-2 min-[1440px]:text-[13.5px]">
            {fmtMoney(row.original.creditLimit, row.original.currency)}
          </span>
        ),
      },
      {
        id: "status",
        accessorFn: (c: Customer) => c.status,
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <CustomerStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        size: 90,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon-sm" aria-label="Edit customer" onClick={() => setEditId(row.original.id)}>
              <Pencil />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Delete customer" onClick={() => setDeleteId(row.original.id)}>
              <Trash2 className="text-red" />
            </Button>
          </div>
        ),
      },
    ],
    [outstandingByCustomer]
  );

  return (
    <div>
      <PageHeading
        title="Customers"
        subtitle="Manage your customer directory"
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus /> Add Customer
          </Button>
        }
      />

      <FilterableTable
        columns={columns}
        data={filtered}
        loading={loading}
        getRowId={(customer) => customer.id}
        onRowClick={(customer) => router.push(`/dashboard/customers/${customer.id}`)}
        rowClassName="cursor-pointer"
        emptyState="No customers match your filters."
        search={{ value: filters.search, onChange: (search) => setFilters({ ...filters, search }), placeholder: "Search customers..." }}
        filters={
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: (v ?? "all") as Filters["status"] })}>
            <SelectTrigger size="sm">
              <SelectValue>
                {(v: Filters["status"]) => (v === "all" || !v ? "All status" : <CustomerStatusBadge status={v} />)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              {CUSTOMER_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  <CustomerStatusBadge status={status} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        onClearFilters={() => setFilters({ search: "", status: "all" })}
        mobileCard={(customer) => {
          const balance = outstandingByCustomer.get(customer.id) ?? 0;
          return (
            <div className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-text">{customer.name}</span>
                  <span className="text-[11px] text-text-4">{customer.customerCode}</span>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon-sm" aria-label="Edit customer" onClick={() => setEditId(customer.id)}>
                    <Pencil />
                  </Button>
                  <Button variant="ghost" size="icon-sm" aria-label="Delete customer" onClick={() => setDeleteId(customer.id)}>
                    <Trash2 className="text-red" />
                  </Button>
                </div>
              </div>
              <div className="text-[12px] text-text-2">{customer.email}</div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <CustomerStatusBadge status={customer.status} />
                <span className={balance > 0 ? "text-[12px] font-semibold text-amber" : "text-[12px] text-text-3"}>
                  {fmtMoney(balance, customer.currency)} outstanding
                </span>
              </div>
            </div>
          );
        }}
      />

      <AddCustomerDialog open={addOpen} onOpenChange={setAddOpen} onCreated={() => {}} />

      {editId && <CustomerEditDialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)} customerId={editId} />}

      {deleteCustomer && (
        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title={`Delete ${deleteCustomer.name}?`}
          description="This permanently removes the customer from your CRM. Existing invoices keep referencing this customer's name but the record itself will no longer be selectable for new invoices."
          confirmLabel="Delete customer"
          destructive
          onConfirm={async () => {
            await customersApi.remove(deleteCustomer.id);
            queryClient.invalidateQueries({ queryKey: crmKeys.customers() });
          }}
          successMessage={`${deleteCustomer.name} deleted`}
        />
      )}
    </div>
  );
}
