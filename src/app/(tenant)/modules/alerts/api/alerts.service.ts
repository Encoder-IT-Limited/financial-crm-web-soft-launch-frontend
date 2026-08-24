import { fmtDate, fmtMoney } from "@/lib/format";
import { daysPast, retainerPercentUsed } from "../../billing/types";
import { retainersApi } from "../../billing/api/retainers.service";
import { RETAINER_ALERT_THRESHOLDS, type Alert } from "../types";

/** Simulated network latency for the mock API. */
const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock API — computes alerts fresh from live retainer data every call
 * (no stored alerts table). Scope is deliberately limited to the two
 * retainer triggers from Phase H4; not a general alerting system.
 */
export const alertsApi = {
  list: async (): Promise<Alert[]> => {
    await delay();
    const retainers = await retainersApi.list();
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

    return alerts;
  },
};
