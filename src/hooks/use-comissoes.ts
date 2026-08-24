import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { comissoesApi, ComissoesFiltro } from "@/lib/api/comissoes";
import { ApiError } from "@/lib/http";
import type { ComissaoInput } from "@/types/entities";

export const comissoesKeys = {
  all: ["comissoes"] as const,
  lista: (params?: ComissoesFiltro) => [...comissoesKeys.all, "lista", params] as const,
};

export function useComissoes(params?: ComissoesFiltro) {
  return useQuery({
    queryKey: comissoesKeys.lista(params),
    queryFn: () => comissoesApi.listar(params),
    placeholderData: (previous) => previous,
  });
}

export function useCriarComissao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ComissaoInput) => comissoesApi.criar(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comissoesKeys.all });
      toast.success("Comissão cadastrada.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useAtualizarComissao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ComissaoInput> }) =>
      comissoesApi.atualizar(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comissoesKeys.all });
      toast.success("Comissão atualizada.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useRemoverComissao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => comissoesApi.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comissoesKeys.all });
      toast.success("Comissão removida.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}
