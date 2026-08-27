import { apiGet, apiSend } from "@/lib/api/envelope";
import type { Customer, CustomerStatus, Currency } from "../types";
import { asCurrency } from "../types";
import type { CustomerEditValues, CustomerValues } from "../schemas";

type ApiCustomer = {
  id: string;
  customerCode: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxNumber: string | null;
  creditLimit: number;
  openingBalance: number;
  status: string;
};

function mapCustomer(row: ApiCustomer): Customer {
  return {
    id: row.id,
    customerCode: row.customerCode,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    trn: row.taxNumber ?? "",
    currency: asCurrency(undefined),
    creditLimit: Number(row.creditLimit ?? 0),
    openingBalance: Number(row.openingBalance ?? 0),
    status: (row.status === "INACTIVE" ? "inactive" : "active") as CustomerStatus,
  };
}

export type CustomerStatementRow = {
  id: string;
  date: string;
  description: string;
  charge: number;
  credit: number;
  balance: number;
};

export type CustomerStatement = {
  customerId: string;
  customerName: string;
  customerCode: string;
  currency: Currency;
  openingBalance: number;
  closingBalance: number;
  rows: CustomerStatementRow[];
};

type ApiStatement = {
  customerId: string;
  customerName: string;
  customerCode: string;
  currency?: string | null;
  openingBalance: number | string;
  closingBalance: number | string;
  rows?: Array<{
    id: string;
    date: string;
    description: string;
    charge: number | string;
    credit: number | string;
    balance: number | string;
  }>;
};

export const customersApi = {
  list: async (): Promise<Customer[]> => (await apiGet<ApiCustomer[]>("/customers")).map(mapCustomer),

  get: async (id: string): Promise<Customer | undefined> => {
    try {
      return mapCustomer(await apiGet<ApiCustomer>(`/customers/${id}`));
    } catch {
      return undefined;
    }
  },

  statement: async (id: string): Promise<CustomerStatement> => {
    const row = await apiGet<ApiStatement>(`/customers/${id}/statement`);
    return {
      customerId: row.customerId,
      customerName: row.customerName,
      customerCode: row.customerCode,
      currency: asCurrency(row.currency),
      openingBalance: Number(row.openingBalance ?? 0),
      closingBalance: Number(row.closingBalance ?? 0),
      rows: (row.rows ?? []).map((entry) => ({
        id: entry.id,
        date: entry.date,
        description: entry.description,
        charge: Number(entry.charge ?? 0),
        credit: Number(entry.credit ?? 0),
        balance: Number(entry.balance ?? 0),
      })),
    };
  },

  create: async (input: CustomerValues): Promise<Customer> =>
    mapCustomer(
      await apiSend<ApiCustomer>("post", "/customers", {
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: input.address,
        taxNumber: input.trn,
      }),
    ),

  update: async (id: string, input: CustomerEditValues): Promise<void> => {
    await apiSend("patch", `/customers/${id}`, {
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      taxNumber: input.trn,
      creditLimit: input.creditLimit,
      openingBalance: input.openingBalance,
      status: input.status === "inactive" ? "INACTIVE" : "ACTIVE",
    });
  },

  remove: async (id: string): Promise<void> => {
    await apiSend("delete", `/customers/${id}`);
  },
};
