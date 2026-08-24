/* ------------------------------------------------------------------ */
/* Alerts — minimal, Phase H4 scope only: retainer expiry and low-      */
/* balance warnings (docs/Sales-Invoicing-Implementation-Plan.md Phase  */
/* H4). Not a general-purpose alerting system for the rest of the app — */
/* alerts here are derived on read from live retainer data, never       */
/* stored, so there's nothing to keep in sync with a background job     */
/* that doesn't exist in this frontend-only build.                      */
/* ------------------------------------------------------------------ */

export type AlertSeverity = "info" | "warning";

export type AlertType = "retainer-expiring" | "retainer-low-balance";

export type Alert = {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  relatedRetainerId: string;
  createdAt: string; // always "now" — these are computed on every read
};

export type RetainerAlertThresholds = {
  expiringWithinDays: number;
  lowBalancePercentRemaining: number;
};

/** Configurable defaults (Key Decision #12) — arbitrary by nature, so kept
 *  as one exported constant rather than hardcoded inline, ready to be wired
 *  to a real Settings field once tenant Settings exists (currently a
 *  ComingSoon stub). */
export const RETAINER_ALERT_THRESHOLDS: RetainerAlertThresholds = {
  expiringWithinDays: 14,
  lowBalancePercentRemaining: 20,
};
