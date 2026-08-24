import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fornecedoresApi, FornecedoresFiltro } from "@/lib/api/fornecedores";
import { ApiError } from "@/lib/http";
import type { FornecedorInput } from "@/types/entities";

export const fornecedoresKeys = {
  all: ["fornecedores"] as const,
  lista: (params?: FornecedoresFiltro) => [...fornecedoresKeys.all, "lista", params] as const,
};

export function useFornecedores(params?: FornecedoresFiltro) {
  return useQuery({
    queryKey: fornecedoresKeys.lista(params),
    queryFn: () => fornecedoresApi.listar(params),
    placeholderData: (previous) => previous,
  });
}

export function useCriarFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FornecedorInput) => fornecedoresApi.criar(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fornecedoresKeys.all });
      toast.success("Fornecedor cadastrado.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useAtualizarFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<FornecedorInput> }) =>
      fornecedoresApi.atualizar(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fornecedoresKeys.all });
      toast.success("Fornecedor atualizado.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useRemoverFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fornecedoresApi.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fornecedoresKeys.all });
      toast.success("Fornecedor removido.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}
