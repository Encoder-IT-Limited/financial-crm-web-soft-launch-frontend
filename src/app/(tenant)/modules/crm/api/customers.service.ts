import { apiGet, apiSend } from "@/lib/api/envelope";
import type { Customer, CustomerStatus, Currency } from "../types";
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
    currency: "AED" as Currency,
    creditLimit: Number(row.creditLimit ?? 0),
    openingBalance: Number(row.openingBalance ?? 0),
    status: (row.status === "INACTIVE" ? "inactive" : "active") as CustomerStatus,
  };
}

export const customersApi = {
  list: async (): Promise<Customer[]> => (await apiGet<ApiCustomer[]>("/customers")).map(mapCustomer),

  get: async (id: string): Promise<Customer | undefined> => {
    try {
      return mapCustomer(await apiGet<ApiCustomer>(`/customers/${id}`));
    } catch {
      return undefined;
    }
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
