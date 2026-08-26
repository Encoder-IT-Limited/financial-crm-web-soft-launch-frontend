/* ------------------------------------------------------------------ */
/* Alerts — retainer expiry/low-balance and fulfillment reconciliation. */
/* ------------------------------------------------------------------ */

export type AlertSeverity = "info" | "warning";

export type AlertType = "retainer-expiring" | "retainer-low-balance" | "fulfillment-pending-reconciliation";

export type Alert = {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  relatedRetainerId?: string;
  relatedInvoiceId?: string;
  relatedFulfillmentLineId?: string;
  createdAt: string;
};

export type RetainerAlertThresholds = {
  expiringWithinDays: number;
  lowBalancePercentRemaining: number;
};

export const RETAINER_ALERT_THRESHOLDS: RetainerAlertThresholds = {
  expiringWithinDays: 14,
  lowBalancePercentRemaining: 20,
};
