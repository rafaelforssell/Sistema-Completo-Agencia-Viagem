import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { leadsApi, LeadsFiltro } from "@/lib/api/crm";
import { ApiError } from "@/lib/http";
import type { LeadInput } from "@/types/entities";

export const leadsKeys = {
  all: ["crm", "leads"] as const,
  lista: (params?: LeadsFiltro) => [...leadsKeys.all, "lista", params] as const,
};

export function useLeads(params?: LeadsFiltro) {
  return useQuery({
    queryKey: leadsKeys.lista(params),
    queryFn: () => leadsApi.listar(params),
    placeholderData: (previous) => previous,
  });
}

export function useCriarLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LeadInput) => leadsApi.criar(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
      toast.success("Lead cadastrado.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useAtualizarLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<LeadInput> }) =>
      leadsApi.atualizar(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
      toast.success("Lead atualizado.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useAtualizarEtapaLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, etapa }: { id: string; etapa: string }) => leadsApi.atualizarEtapa(id, etapa),
    onMutate: async ({ id, etapa }) => {
      await queryClient.cancelQueries({ queryKey: leadsKeys.all });
      const previous = queryClient.getQueriesData({ queryKey: leadsKeys.all });
      previous.forEach(([key, data]) => {
        if (!data || typeof data !== "object" || !("dados" in data)) return;
        const lista = data as { dados: { id: string; etapa: string }[] };
        queryClient.setQueryData(key, {
          ...lista,
          dados: lista.dados.map((lead) => (lead.id === id ? { ...lead, etapa } : lead)),
        });
      });
      return { previous };
    },
    onError: (error: ApiError, _vars, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
    },
  });
}

export function useRemoverLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadsApi.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKeys.all });
      toast.success("Lead removido.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}
