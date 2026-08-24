"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { proposalsApi } from "../api/proposals.service";
import type { NewProposalInput } from "../types";
import { billingKeys } from "../query-keys";

export function useProposals() {
  return useQuery({ queryKey: billingKeys.proposals(), queryFn: proposalsApi.list });
}

export function useProposal(id: string) {
  return useQuery({
    queryKey: billingKeys.proposal(id),
    queryFn: () => proposalsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { input: NewProposalInput; mode: "draft" | "send" }) =>
      proposalsApi.create(args.input, args.mode),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.proposals() });
      void qc.invalidateQueries({ queryKey: billingKeys.proposalNextNumber() });
    },
  });
}

export function useUpdateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; input: NewProposalInput }) => proposalsApi.update(args.id, args.input),
    onSuccess: (_d, args) => {
      void qc.invalidateQueries({ queryKey: billingKeys.proposals() });
      void qc.invalidateQueries({ queryKey: billingKeys.proposal(args.id) });
    },
  });
}

export function useSendProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proposalsApi.send(id),
    onSuccess: (_d, id) => {
      void qc.invalidateQueries({ queryKey: billingKeys.proposals() });
      void qc.invalidateQueries({ queryKey: billingKeys.proposal(id) });
    },
  });
}

export function useRejectProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proposalsApi.reject(id),
    onSuccess: (_d, id) => {
      void qc.invalidateQueries({ queryKey: billingKeys.proposals() });
      void qc.invalidateQueries({ queryKey: billingKeys.proposal(id) });
    },
  });
}

export function useConvertProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proposalsApi.convertToInvoice(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.proposals() });
      void qc.invalidateQueries({ queryKey: billingKeys.invoices() });
    },
  });
}
