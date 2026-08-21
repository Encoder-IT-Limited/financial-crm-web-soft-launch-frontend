import { newId, nextSequence } from "@/lib/format";
import type { Customer } from "../types";
import type { CustomerEditValues, CustomerValues } from "../schemas";
import { seedCustomers, seedCustomerSeq } from "../mock/seed";

/** Simulated network latency for the mock API. */
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory mock "database" — module-scoped, resets on page reload. React
// Query (useQuery/invalidateQueries) is the reactivity layer; this is just
// the data these functions read/write.
let customers: Customer[] = seedCustomers;
let customerSeq: number = seedCustomerSeq;

/**
 * Mock API service layer for Customers. Consumed by the CRM pages and by
 * billing (invoice customer pickers) — one source of truth, no duplication.
 */
export const customersApi = {
  list: async (): Promise<Customer[]> => {
    await delay(200);
    return customers;
  },

  get: async (id: string): Promise<Customer | undefined> => {
    await delay(150);
    return customers.find((customer) => customer.id === id);
  },

  /** Quick-create (AddCustomerDialog) — only collects contact fields;
   *  financial fields get sensible defaults so the invoice-creation flow
   *  never has to think about them. */
  create: async (input: CustomerValues): Promise<Customer> => {
    await delay();
    const created: Customer = {
      ...input,
      id: newId("cust"),
      customerCode: `CUST-${nextSequence(customerSeq)}`,
      currency: "AED",
      creditLimit: 0,
      openingBalance: 0,
      status: "active",
    };
    customers = [...customers, created];
    customerSeq += 1;
    return created;
  },

  update: async (id: string, input: CustomerEditValues): Promise<void> => {
    await delay();
    customers = customers.map((customer) => (customer.id === id ? { ...customer, ...input } : customer));
  },

  remove: async (id: string): Promise<void> => {
    await delay();
    customers = customers.filter((customer) => customer.id !== id);
  },
};
