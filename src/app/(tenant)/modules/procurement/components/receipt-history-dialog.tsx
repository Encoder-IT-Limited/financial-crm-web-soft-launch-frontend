"use client";

import { PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FormDialog } from "@/components/shared/form-dialog";
import { fmtDate } from "@/lib/format";
import { useGoodsReceipts } from "../hooks/use-procurement";

const STATUS_TONE: Record<string, "green" | "amber" | "neutral"> = {
  COMPLETED: "green",
  PENDING: "amber",
};

/** Read-only — every receipt ever recorded against one purchase order.
 * `procurementApi.listGoodsReceipts` already returns this; nothing
 * previously called it, so past receipts were invisible in the app. */
export function ReceiptHistoryDialog({
  open,
  onOpenChange,
  purchaseOrderId,
  poNumber,
  warehouseName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrderId: string;
  poNumber: string;
  warehouseName: string;
}) {
  const { data: receipts = [], isLoading } = useGoodsReceipts(purchaseOrderId);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={poNumber ? `Receipts for ${poNumber}` : "Receipt history"}
      description={warehouseName ? `Received into ${warehouseName}` : undefined}
      onSubmit={() => onOpenChange(false)}
      submitLabel="Close"
    >
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : receipts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <PackageCheck className="size-7 text-text-4" />
          <p className="text-[12.5px] text-text-3">No receipts recorded against this PO yet.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {receipts.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-[12.5px]">
              <div>
                <div className="font-semibold text-text">{r.receiptNumber}</div>
                <div className="text-text-3">{fmtDate(r.receiptDate)}</div>
              </div>
              <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </FormDialog>
  );
}
