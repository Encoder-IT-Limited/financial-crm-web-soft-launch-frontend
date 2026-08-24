import { fmtDate, fmtMoney } from "@/lib/format";
import { daysPast, retainerPercentUsed } from "../../billing/types";
import { invoiceApi } from "../../billing/api/invoices.service";
import { retainersApi } from "../../billing/api/retainers.service";
import { RETAINER_ALERT_THRESHOLDS, type Alert } from "../types";

/**
 * Computes alerts from live data (no stored alerts table).
 */
export const alertsApi = {
  list: async (): Promise<Alert[]> => {
    const [retainers, pendingLines, invoices] = await Promise.all([
      retainersApi.list(),
      invoiceApi.listPendingReconciliation(),
      invoiceApi.list(),
    ]);
    const now = new Date().toISOString();
    const alerts: Alert[] = [];

    for (const retainer of retainers) {
      if (retainer.status === "closed") continue;

      if (retainer.expiryDate) {
        const daysUntilExpiry = -daysPast(retainer.expiryDate);
        if (daysUntilExpiry <= RETAINER_ALERT_THRESHOLDS.expiringWithinDays) {
          const overdue = daysUntilExpiry < 0;
          alerts.push({
            id: `alert-expiry-${retainer.id}`,
            type: "retainer-expiring",
            severity: "warning",
            title: overdue ? `${retainer.number} has expired` : `${retainer.number} is expiring soon`,
            message: overdue
              ? `Contract ended ${fmtDate(retainer.expiryDate)} (${Math.abs(daysUntilExpiry)} day(s) ago) — review disposition: Transfer, Roll Over, Forfeit, or Refund.`
              : `Contract ends ${fmtDate(retainer.expiryDate)} — ${daysUntilExpiry} day(s) from now.`,
            relatedRetainerId: retainer.id,
            createdAt: now,
          });
        }
      }

      if (retainer.remainingBalance > 0) {
        const percentRemaining = 100 - retainerPercentUsed(retainer);
        if (percentRemaining <= RETAINER_ALERT_THRESHOLDS.lowBalancePercentRemaining) {
          alerts.push({
            id: `alert-balance-${retainer.id}`,
            type: "retainer-low-balance",
            severity: percentRemaining <= 5 ? "warning" : "info",
            title: `${retainer.number} balance is running low`,
            message: `Only ${fmtMoney(retainer.remainingBalance, retainer.currency)} left (${percentRemaining}% of the contract).`,
            relatedRetainerId: retainer.id,
            createdAt: now,
          });
        }
      }
    }

    for (const line of pendingLines) {
      const invoice = invoices.find((inv) => inv.id === line.invoiceId);
      if (!invoice) continue;
      const item = invoice.lines.find((l) => l.id === line.invoiceLineId);
      alerts.push({
        id: `alert-reconcile-${line.id}`,
        type: "fulfillment-pending-reconciliation",
        severity: "warning",
        title: `${invoice.number} — stock needs reconciliation`,
        message: `${item?.description ?? "Line item"} shipped ${line.quantityFulfilled} unit(s) below zero stock — review and reconcile.`,
        relatedInvoiceId: invoice.id,
        relatedFulfillmentLineId: line.id,
        createdAt: now,
      });
    }

    return alerts;
  },
};
