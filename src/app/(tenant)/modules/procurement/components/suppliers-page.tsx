"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormDialog } from "@/components/shared/form-dialog";
import { FormField } from "@/components/shared/form-field";
import { PageHeading } from "@/components/shared/page-heading";
import { ApiError } from "@/lib/api/errors";
import { toast } from "@/lib/toast";
import { useCreateSupplier, useSuppliers } from "../hooks/use-procurement";

export function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function reset() {
    setCode("");
    setName("");
    setEmail("");
    setPhone("");
  }

  async function handleCreate() {
    if (!code.trim() || !name.trim()) {
      toast.error("Code and name are required");
      return;
    }
    try {
      await createSupplier.mutateAsync({
        supplierCode: code.trim(),
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      toast.success("Vendor created");
      reset();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not create vendor");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeading
        title="Vendors"
        subtitle="Supplier directory for purchase orders"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus data-icon="inline-start" />
            Add vendor
          </Button>
        }
      />

      <Card className="p-5">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : suppliers.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-text-3">No vendors yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-[10px] border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-subtle hover:bg-surface-subtle">
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="tabular-nums font-semibold">{s.supplierCode}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell className="text-text-2">{s.email ?? "—"}</TableCell>
                    <TableCell className="text-text-2">{s.phone ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <FormDialog
        open={open}
        onOpenChange={(next) => {
          if (!next) reset();
          setOpen(next);
        }}
        title="New vendor"
        onSubmit={handleCreate}
        submitLabel="Create"
        submitting={createSupplier.isPending}
      >
        <FormField label="Code">
          <Input value={code} onChange={(e) => setCode(e.target.value)} className="h-9" placeholder="SUP-001" />
        </FormField>
        <FormField label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
        </FormField>
        <FormField label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} className="h-9" type="email" />
        </FormField>
        <FormField label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9" />
        </FormField>
      </FormDialog>
    </div>
  );
}
