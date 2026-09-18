import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { carteiraApi } from "@/lib/api/carteira";
import { ApiError } from "@/lib/http";
import type { CarteiraMovimentoInput } from "@/types/entities";

export const carteiraKeys = {
  resumo: (fornecedorId: string) => ["carteira", fornecedorId] as const,
};

export function useCarteiraFornecedor(fornecedorId?: string) {
  return useQuery({
    queryKey: carteiraKeys.resumo(fornecedorId ?? ""),
    queryFn: () => carteiraApi.resumo(fornecedorId as string),
    enabled: Boolean(fornecedorId),
  });
}

export function useAdicionarMovimentoCarteira(fornecedorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CarteiraMovimentoInput) => carteiraApi.adicionarMovimento(fornecedorId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carteiraKeys.resumo(fornecedorId) });
      toast.success("Movimento registrado.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useRemoverMovimentoCarteira(fornecedorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (movimentoId: string) => carteiraApi.removerMovimento(fornecedorId, movimentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: carteiraKeys.resumo(fornecedorId) });
      toast.success("Movimento removido.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}
