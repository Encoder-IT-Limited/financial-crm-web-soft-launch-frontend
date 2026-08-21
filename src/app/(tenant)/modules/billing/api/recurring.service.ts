import { newId, nextSequence } from "@/lib/format";
import type { Invoice } from "../types";
import { advanceDate, type NewRecurringTemplateInput, type RecurringTemplate, type RecurringTemplateStatus } from "../recurring/types";
import { seedRecurringTemplates, seedRecurringTemplateSeq } from "../mock/seed-recurring";
import { invoiceApi } from "./invoices.service";

/** Simulated network latency for the mock API. */
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory mock "database" — module-scoped, resets on page reload. Replaces
// the old Zustand store; React Query is the reactivity layer.
let templates: RecurringTemplate[] = seedRecurringTemplates;
let templateSeq: number = seedRecurringTemplateSeq;

/**
 * Mock API service layer for recurring invoice templates. Generated invoices
 * are created as drafts for review — auto-send is an open question
 * (SRS §7 Q29), so generation stays manual-trigger.
 */
export const recurringApi = {
  list: async (): Promise<RecurringTemplate[]> => {
    await delay(200);
    return templates;
  },

  create: async (input: NewRecurringTemplateInput): Promise<RecurringTemplate> => {
    await delay();
    const template: RecurringTemplate = {
      id: newId("rec"),
      number: `REC-${nextSequence(templateSeq, 3)}`,
      customerId: input.customerId,
      description: input.description,
      currency: input.currency,
      amount: input.amount,
      frequency: input.frequency,
      nextInvoiceDate: input.nextInvoiceDate,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    templates = [template, ...templates];
    templateSeq += 1;
    return template;
  },

  update: async (id: string, input: NewRecurringTemplateInput): Promise<void> => {
    await delay();
    templates = templates.map((template) =>
      template.id === id
        ? {
            ...template,
            customerId: input.customerId,
            description: input.description,
            currency: input.currency,
            amount: input.amount,
            frequency: input.frequency,
            nextInvoiceDate: input.nextInvoiceDate,
          }
        : template
    );
  },

  setStatus: async (id: string, status: RecurringTemplateStatus): Promise<void> => {
    await delay(150);
    templates = templates.map((template) => (template.id === id ? { ...template, status } : template));
  },

  remove: async (id: string): Promise<void> => {
    await delay();
    templates = templates.filter((template) => template.id !== id);
  },

  /** Generate the next invoice for a template. Returns the created (draft)
   *  invoice tagged with source "recurring", or null when the template is
   *  paused. */
  generate: async (id: string): Promise<Invoice | null> => {
    await delay();
    const template = templates.find((t) => t.id === id);
    if (!template || template.status !== "active") return null;

    const today = new Date();
    const issueDate = today.toISOString().slice(0, 10);
    const due = new Date(today);
    due.setDate(due.getDate() + 15);

    const invoice = await invoiceApi.create(
      {
        customerId: template.customerId,
        issueDate,
        dueDate: due.toISOString().slice(0, 10),
        currency: template.currency,
        lines: [
          {
            description: `${template.description} — ${today.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`,
            quantity: 1,
            unitPrice: template.amount,
            taxRate: 0,
          },
        ],
        notes: `Recurring billing from template ${template.number}`,
      },
      "draft",
      "recurring"
    );

    templates = templates.map((t) =>
      t.id === id
        ? {
            ...t,
            nextInvoiceDate: advanceDate(t.nextInvoiceDate, t.frequency),
            lastInvoiceId: invoice.id,
            lastGeneratedAt: new Date().toISOString(),
          }
        : t
    );

    return invoice;
  },
};
