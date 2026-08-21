"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { newId, nextSequence } from "@/lib/format";
import { useInvoicesStore } from "../../store/invoices-store";
import type { Invoice } from "../../types";
import { advanceDate, type NewRecurringTemplateInput, type RecurringTemplate, type RecurringTemplateStatus } from "../types";
import { seedRecurringTemplates, seedRecurringTemplateSeq } from "../../mock/seed-recurring";

type RecurringStore = {
  templates: RecurringTemplate[];
  templateSeq: number;

  addTemplate: (input: NewRecurringTemplateInput) => RecurringTemplate;
  updateTemplate: (id: string, input: NewRecurringTemplateInput) => void;
  setTemplateStatus: (id: string, status: RecurringTemplateStatus) => void;
  removeTemplate: (id: string) => void;
  /** Generate the next invoice for a template. Returns the created
   *  (draft) invoice, or null when the template is paused. Generated as a
   *  draft for review — auto-send is an open question (SRS §7 Q29). */
  generateInvoice: (id: string) => Invoice | null;
};

export const useRecurringStore = create<RecurringStore>()(
  persist(
    (set, get) => ({
      templates: seedRecurringTemplates,
      templateSeq: seedRecurringTemplateSeq,

      addTemplate: (input) => {
        const template: RecurringTemplate = {
          id: newId("rec"),
          number: `REC-${nextSequence(get().templateSeq, 3)}`,
          customerId: input.customerId,
          description: input.description,
          currency: input.currency,
          amount: input.amount,
          frequency: input.frequency,
          nextInvoiceDate: input.nextInvoiceDate,
          status: "active",
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ templates: [template, ...state.templates], templateSeq: state.templateSeq + 1 }));
        return template;
      },

      updateTemplate: (id, input) => {
        set((state) => ({
          templates: state.templates.map((template) =>
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
          ),
        }));
      },

      setTemplateStatus: (id, status) => {
        set((state) => ({
          templates: state.templates.map((template) => (template.id === id ? { ...template, status } : template)),
        }));
      },

      removeTemplate: (id) => {
        set((state) => ({ templates: state.templates.filter((template) => template.id !== id) }));
      },

      generateInvoice: (id) => {
        const template = get().templates.find((t) => t.id === id);
        if (!template || template.status !== "active") return null;

        const today = new Date();
        const issueDate = today.toISOString().slice(0, 10);
        const due = new Date(today);
        due.setDate(due.getDate() + 15);

        const invoice = useInvoicesStore.getState().createInvoice(
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
          "draft"
        );

        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id
              ? {
                  ...t,
                  nextInvoiceDate: advanceDate(t.nextInvoiceDate, t.frequency),
                  lastInvoiceId: invoice.id,
                  lastGeneratedAt: new Date().toISOString(),
                }
              : t
          ),
        }));

        return invoice;
      },
    }),
    {
      name: "mrm-recurring-v1",
      version: 1,
    }
  )
);