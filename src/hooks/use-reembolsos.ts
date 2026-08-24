import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reembolsosApi, ReembolsosFiltro } from "@/lib/api/reembolsos";
import { ApiError } from "@/lib/http";
import type { ReembolsoInput } from "@/types/entities";

export const reembolsosKeys = {
  all: ["reembolsos"] as const,
  lista: (params?: ReembolsosFiltro) => [...reembolsosKeys.all, "lista", params] as const,
  porViagem: (viagemId: string) => [...reembolsosKeys.all, "viagem", viagemId] as const,
};

export function useReembolsos(params?: ReembolsosFiltro) {
  return useQuery({
    queryKey: reembolsosKeys.lista(params),
    queryFn: () => reembolsosApi.listar(params),
    placeholderData: (previous) => previous,
  });
}

export function useReembolsosPorViagem(viagemId: string | undefined) {
  return useQuery({
    queryKey: reembolsosKeys.porViagem(viagemId ?? ""),
    queryFn: () => reembolsosApi.listarPorViagem(viagemId as string),
    enabled: Boolean(viagemId),
  });
}

export function useCriarReembolso(viagemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReembolsoInput) => reembolsosApi.criar(viagemId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reembolsosKeys.all });
      toast.success("Reembolso registrado.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useAtualizarReembolso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ReembolsoInput> }) =>
      reembolsosApi.atualizar(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reembolsosKeys.all });
      toast.success("Reembolso atualizado.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useRemoverReembolso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reembolsosApi.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reembolsosKeys.all });
      toast.success("Reembolso removido.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}
