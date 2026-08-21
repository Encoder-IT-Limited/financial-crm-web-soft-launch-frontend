"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { useQuery } from "@tanstack/react-query";
import type { Invoice } from "../types";
import { InvoicePdf } from "./invoice-pdf";
import { customersApi } from "../../crm/api/customers.service";

/** List-page "Preview PDF ↗" — mirrors the prototype's modal-inv-preview. */
export function InvoicePreviewDialog({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: customersApi.list });
  const customer = invoice ? customers.find((c) => c.id === invoice.customerId) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background">
        <DialogHeader>
          <DialogTitle>Invoice PDF Preview</DialogTitle>
          <DialogDescription>{invoice?.number}</DialogDescription>
        </DialogHeader>

        {invoice && <InvoicePdf invoice={invoice} customer={customer} />}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              toast.success(`PDF downloaded — ${invoice?.number}.pdf`);
            }}
          >
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}