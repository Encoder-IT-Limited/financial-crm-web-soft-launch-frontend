import { z } from "zod";
import { CUSTOMER_STATUSES } from "./types";

/** Quick-create fields — used by AddCustomerDialog (invoice/recurring flows).
 *  Financial fields (customerCode, creditLimit, openingBalance, status)
 *  aren't collected here; the service fills sensible defaults. */
export const customerSchema = z.object({
  name: z.string().trim().min(2, "Company name is required"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(5, "Enter a valid phone number"),
  address: z.string().trim().min(3, "Address is required"),
  trn: z.string().trim().min(5, "Enter a valid TRN"),
});

export type CustomerValues = z.infer<typeof customerSchema>;

/** Full field set — used by the Customers list/detail pages' edit form. */
export const customerEditSchema = customerSchema.extend({
  creditLimit: z.coerce.number().min(0, "Credit limit can't be negative"),
  openingBalance: z.coerce.number().min(0, "Opening balance can't be negative"),
  status: z.enum(CUSTOMER_STATUSES),
});

export type CustomerEditValues = z.infer<typeof customerEditSchema>;
