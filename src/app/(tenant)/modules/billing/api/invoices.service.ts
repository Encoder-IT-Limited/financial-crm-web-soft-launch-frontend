"use client";

import type { Customer, Invoice, NewInvoiceInput, RecordPaymentInput } from "../types";
import { useInvoicesStore } from "../store/invoices-store";

/** Simulated network latency for the mock API. */
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock API service layer for invoicing. Every function returns a Promise so
 * the UI consumes it exactly like the real REST API (apiGet/apiSend pattern
 * in Basic-Setup.md §6) — swap the bodies for real calls later without
 * touching any component.
 */
export const invoiceApi = {
  list: async (): Promise<Invoice[]> => {
    await delay(250);
    return useInvoicesStore.getState().invoices;
  },

  get: async (id: string): Promise<Invoice | undefined> => {
    await delay(200);
    return useInvoicesStore.getState().invoices.find((inv) => inv.id === id);
  },

  create: async (input: NewInvoiceInput, mode: "draft" | "send"): Promise<Invoice> => {
    await delay();
    return useInvoicesStore.getState().createInvoice(input, mode);
  },

  update: async (id: string, input: NewInvoiceInput): Promise<void> => {
    await delay();
    useInvoicesStore.getState().updateInvoice(id, input);
  },

  send: async (id: string): Promise<void> => {
    await delay();
    useInvoicesStore.getState().sendInvoice(id);
  },

  recordPayment: async (id: string, input: RecordPaymentInput): Promise<void> => {
    await delay();
    useInvoicesStore.getState().recordPayment(id, input);
  },

  cancel: async (id: string): Promise<void> => {
    await delay();
    useInvoicesStore.getState().cancelInvoice(id);
  },

  sendReminder: async (id: string): Promise<void> => {
    await delay(500);
    useInvoicesStore.getState().sendReminder(id);
  },

  listCustomers: async (): Promise<Customer[]> => {
    await delay(200);
    return useInvoicesStore.getState().customers;
  },

  addCustomer: async (customer: Omit<Customer, "id" | "currency">): Promise<Customer> => {
    await delay();
    return useInvoicesStore.getState().addCustomer(customer);
  },
};