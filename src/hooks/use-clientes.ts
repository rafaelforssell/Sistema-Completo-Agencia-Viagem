import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientesApi } from "@/lib/api/clientes";
import { ApiError } from "@/lib/http";
import type { ClienteInput, PaginationParams } from "@/types/entities";

export const clientesKeys = {
  all: ["clientes"] as const,
  lista: (params?: PaginationParams) => [...clientesKeys.all, "lista", params] as const,
  detalhe: (id: string) => [...clientesKeys.all, "detalhe", id] as const,
};

export function useClientes(params?: PaginationParams) {
  return useQuery({
    queryKey: clientesKeys.lista(params),
    queryFn: () => clientesApi.listar(params),
    placeholderData: (previous) => previous,
  });
}

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: clientesKeys.detalhe(id ?? ""),
    queryFn: () => clientesApi.obter(id as string),
    enabled: Boolean(id),
  });
}

export function useCriarCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ClienteInput) => clientesApi.criar(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientesKeys.all });
      toast.success("Cliente cadastrado com sucesso.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useAtualizarCliente(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ClienteInput>) => clientesApi.atualizar(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientesKeys.all });
      toast.success("Cliente atualizado com sucesso.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useRemoverCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientesApi.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientesKeys.all });
      toast.success("Cliente removido.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}
