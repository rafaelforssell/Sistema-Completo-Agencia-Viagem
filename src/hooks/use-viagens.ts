import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { passageirosApi, viagensApi, ViagensFiltro } from "@/lib/api/viagens";
import { ApiError } from "@/lib/http";
import type { PassageiroInput, ViagemInput } from "@/types/entities";

export const viagensKeys = {
  all: ["viagens"] as const,
  lista: (params?: ViagensFiltro) => [...viagensKeys.all, "lista", params] as const,
  detalhe: (id: string) => [...viagensKeys.all, "detalhe", id] as const,
};

export function useViagens(params?: ViagensFiltro) {
  return useQuery({
    queryKey: viagensKeys.lista(params),
    queryFn: () => viagensApi.listar(params),
    placeholderData: (previous) => previous,
  });
}

export function useViagem(id: string | undefined) {
  return useQuery({
    queryKey: viagensKeys.detalhe(id ?? ""),
    queryFn: () => viagensApi.obter(id as string),
    enabled: Boolean(id),
  });
}

export function useCriarViagem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ViagemInput) => viagensApi.criar(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: viagensKeys.all });
      toast.success("Viagem cadastrada com sucesso.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useAtualizarViagem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ViagemInput>) => viagensApi.atualizar(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: viagensKeys.all });
      toast.success("Viagem atualizada com sucesso.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useRemoverViagem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => viagensApi.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: viagensKeys.all });
      toast.success("Viagem removida.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useGerarVoucher(viagemId: string) {
  return useMutation({
    mutationFn: () => viagensApi.gerarVoucher(viagemId),
    onSuccess: () => toast.success("Voucher gerado com sucesso."),
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useCriarPassageiro(viagemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PassageiroInput) => passageirosApi.criar(viagemId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: viagensKeys.detalhe(viagemId) });
      toast.success("Passageiro adicionado.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useAtualizarPassageiro(viagemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ passageiroId, input }: { passageiroId: string; input: Partial<PassageiroInput> }) =>
      passageirosApi.atualizar(viagemId, passageiroId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: viagensKeys.detalhe(viagemId) });
      toast.success("Passageiro atualizado.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useRemoverPassageiro(viagemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (passageiroId: string) => passageirosApi.remover(viagemId, passageiroId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: viagensKeys.detalhe(viagemId) });
      toast.success("Passageiro removido.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}
