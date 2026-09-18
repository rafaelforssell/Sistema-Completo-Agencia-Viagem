import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { vendasApi, VendasFiltro } from "@/lib/api/vendas";
import { ApiError } from "@/lib/http";
import type { VendaInput } from "@/types/entities";

export const vendasKeys = {
  all: ["vendas"] as const,
  lista: (params?: VendasFiltro) => [...vendasKeys.all, "lista", params] as const,
  detalhe: (id: string) => [...vendasKeys.all, "detalhe", id] as const,
};

export function useVendas(params?: VendasFiltro) {
  return useQuery({
    queryKey: vendasKeys.lista(params),
    queryFn: () => vendasApi.listar(params),
    placeholderData: (previous) => previous,
  });
}

export function useVenda(id?: string) {
  return useQuery({
    queryKey: vendasKeys.detalhe(id ?? ""),
    queryFn: () => vendasApi.detalhe(id as string),
    enabled: Boolean(id),
  });
}

export function useCriarVenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: VendaInput) => vendasApi.criar(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendasKeys.all });
      toast.success("Venda cadastrada.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useAtualizarVenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<VendaInput> }) =>
      vendasApi.atualizar(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendasKeys.all });
      toast.success("Venda atualizada.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useRemoverVenda() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendasApi.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendasKeys.all });
      toast.success("Venda removida.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}
