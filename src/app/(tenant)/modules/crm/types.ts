/* ------------------------------------------------------------------ */
/* CRM — shared contact domain model. Owned here (not inside billing)  */
/* so Customers — and later Vendors, Inquiries, Leads — live in one    */
/* place per docs/Project-Structure.md instead of under Sales.         */
/* ------------------------------------------------------------------ */

export type Currency = "AED" | "USD" | "EUR" | "GBP" | "SAR";

export const CURRENCIES: Currency[] = ["AED", "USD", "EUR", "GBP", "SAR"];

export type CustomerStatus = "active" | "inactive";

export const CUSTOMER_STATUSES: CustomerStatus[] = ["active", "inactive"];

export type Customer = {
  id: string;
  customerCode: string; // CUST-0001 — docs/inv-pos-hr-tenant.md §33.7
  name: string;
  email: string;
  phone: string;
  address: string;
  trn: string; // UAE VAT registration number
  currency: Currency;
  creditLimit: number;
  openingBalance: number;
  status: CustomerStatus;
};
