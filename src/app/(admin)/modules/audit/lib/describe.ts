import type { AuditLogEntry } from "../types";

function fmtField(key: string): string {
  return key.replace(/([A-Z])/g, " $1").toLowerCase().trim();
}

/** Turns an audit entry's action + diff into a plain-language sentence, so
 * the row itself says what happened instead of forcing a click into the
 * raw field-diff table to find out. */
export function describeAuditEntry(entry: AuditLogEntry): string {
  const { action, entity, entityLabel, oldValues, newValues } = entry;

  if (action === "suspend") return `Suspended "${entityLabel}"`;
  if (action === "reactivate") return `Reactivated "${entityLabel}"`;
  if (action === "delete") return `Deleted ${entity.toLowerCase()} "${entityLabel}"`;
  if (action === "login") return "Logged in";
  if (action === "export") return `Exported "${entityLabel}"`;

  if (action === "create") {
    if (entity === "Tenant") {
      const planId = newValues?.planId;
      return planId ? `Created tenant "${entityLabel}" on the ${planId} plan` : `Created tenant "${entityLabel}"`;
    }
    if (entity === "Plan") return `Created plan "${entityLabel}"`;
    if (entity === "Payment") {
      const amount = newValues?.amount;
      const status = newValues?.status;
      return amount
        ? `Recorded AED ${amount} payment for "${entityLabel}"${status ? ` (${status})` : ""}`
        : `Recorded payment "${entityLabel}"`;
    }
    return `Created ${entity.toLowerCase()} "${entityLabel}"`;
  }

  // action === "update" — call out the most meaningful changed field(s)
  if (oldValues && newValues) {
    if ("extraSeatsPurchased" in newValues) {
      const before = oldValues.extraSeatsPurchased ?? 0;
      return `Changed extra seats from ${before} to ${newValues.extraSeatsPurchased} for "${entityLabel}"`;
    }
    if ("status" in newValues && oldValues.status !== newValues.status) {
      return `Changed status from "${oldValues.status}" to "${newValues.status}" for "${entityLabel}"`;
    }
    if ("priceMonthly" in newValues || "additionalSeatPrice" in newValues) {
      return `Updated pricing for plan "${entityLabel}"`;
    }
    const changedFields = Object.keys(newValues).filter(
      (key) => JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])
    );
    if (changedFields.length > 0) {
      return `Updated ${changedFields.map(fmtField).join(", ")} for "${entityLabel}"`;
    }
  }

  return `Updated ${entity.toLowerCase()} "${entityLabel}"`;
}
