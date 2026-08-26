/** Money math matching backend `invoicing.totals.roundMoney` / `pos.pricing`. */

export function roundMoney(value: number): number {
  return Number(Math.round(Number(value + "e2")) + "e-2");
}

export function discountFromRule(
  type: "PERCENTAGE" | "FIXED",
  value: number,
  quantity: number,
  unitPrice: number,
): number {
  const subtotal = quantity * unitPrice;
  const raw = type === "PERCENTAGE" ? (subtotal * value) / 100 : value;
  return roundMoney(Math.min(Math.max(raw, 0), Math.max(subtotal, 0)));
}

export function taxFromRate(quantity: number, unitPrice: number, discount: number, taxRate: number): number {
  const net = Math.max(quantity * unitPrice - discount, 0);
  return roundMoney(net * (taxRate / 100));
}

export function lineTotal(quantity: number, unitPrice: number, discount: number, tax: number): number {
  return roundMoney(quantity * unitPrice - discount + tax);
}

export type CartLine = {
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  stock: number;
  discountRuleId?: string;
  discountRuleName?: string;
  overrideDiscount?: number;
};

export function priceLine(line: CartLine, rule?: { type: "PERCENTAGE" | "FIXED"; value: number } | null) {
  let discount = 0;
  if (rule) {
    discount = discountFromRule(rule.type, rule.value, line.quantity, line.unitPrice);
  } else if (line.overrideDiscount && line.overrideDiscount > 0) {
    discount = roundMoney(Math.min(line.overrideDiscount, line.quantity * line.unitPrice));
  }
  const tax = taxFromRate(line.quantity, line.unitPrice, discount, line.taxRate);
  const total = lineTotal(line.quantity, line.unitPrice, discount, tax);
  return { discount, tax, total, subtotal: roundMoney(line.quantity * line.unitPrice) };
}

export function cartTotals(lines: { subtotal: number; discount: number; tax: number; total: number }[]) {
  return {
    subtotal: roundMoney(lines.reduce((s, l) => s + l.subtotal, 0)),
    discount: roundMoney(lines.reduce((s, l) => s + l.discount, 0)),
    tax: roundMoney(lines.reduce((s, l) => s + l.tax, 0)),
    total: roundMoney(lines.reduce((s, l) => s + l.total, 0)),
  };
}
