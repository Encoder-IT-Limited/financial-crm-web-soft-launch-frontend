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
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import type { Invoice } from "../types";
import { invoiceApi } from "../api/invoices.service";
import { downloadInvoicePdf } from "../lib/invoice-print";
import { InvoicePdf } from "./invoice-pdf";
import { useCustomers } from "../../crm/hooks/use-customers";

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
  const { data: customers = [] } = useCustomers();
  const { data: org } = useQuery({ queryKey: ["org-profile"], queryFn: invoiceApi.getOrgProfile, staleTime: Infinity });
  const customer = invoice ? customers.find((c) => c.id === invoice.customerId) : undefined;

  function handleDownload() {
    if (!invoice || !org) {
      toast.error("Unable to generate PDF — try again in a moment");
      return;
    }
    downloadInvoicePdf(invoice, customer, org);
    toast.success(`Downloaded ${invoice.number}.pdf`);
  }

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
          <Button onClick={handleDownload}>Download PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
