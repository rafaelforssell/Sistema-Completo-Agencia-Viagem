import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { pagamentosApi } from "@/lib/api/pagamentos";
import { viagensKeys } from "@/hooks/use-viagens";
import { ApiError } from "@/lib/http";
import type { PagamentoInput } from "@/types/entities";

export const pagamentosKeys = {
  porViagem: (viagemId: string) => ["pagamentos", "viagem", viagemId] as const,
};

export function usePagamentosPorViagem(viagemId: string | undefined) {
  return useQuery({
    queryKey: pagamentosKeys.porViagem(viagemId ?? ""),
    queryFn: () => pagamentosApi.listarPorViagem(viagemId as string),
    enabled: Boolean(viagemId),
  });
}

export function useCriarPagamento(viagemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PagamentoInput) => pagamentosApi.criar(viagemId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagamentosKeys.porViagem(viagemId) });
      queryClient.invalidateQueries({ queryKey: viagensKeys.detalhe(viagemId) });
      toast.success("Pagamento registrado.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useAtualizarPagamento(viagemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PagamentoInput> }) =>
      pagamentosApi.atualizar(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagamentosKeys.porViagem(viagemId) });
      toast.success("Pagamento atualizado.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useRemoverPagamento(viagemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pagamentosApi.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagamentosKeys.porViagem(viagemId) });
      toast.success("Pagamento removido.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}
