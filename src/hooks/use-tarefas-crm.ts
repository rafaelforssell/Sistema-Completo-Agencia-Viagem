import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { tarefasCrmApi, TarefasFiltro } from "@/lib/api/crm";
import { ApiError } from "@/lib/http";
import type { TarefaCrmInput } from "@/types/entities";

export const tarefasCrmKeys = {
  all: ["crm", "tarefas"] as const,
  lista: (params?: TarefasFiltro) => [...tarefasCrmKeys.all, "lista", params] as const,
};

export function useTarefasCrm(params?: TarefasFiltro) {
  return useQuery({
    queryKey: tarefasCrmKeys.lista(params),
    queryFn: () => tarefasCrmApi.listar(params),
  });
}

export function useCriarTarefaCrm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TarefaCrmInput) => tarefasCrmApi.criar(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tarefasCrmKeys.all });
      toast.success("Tarefa criada.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useAtualizarTarefaCrm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TarefaCrmInput> }) =>
      tarefasCrmApi.atualizar(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tarefasCrmKeys.all });
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useRemoverTarefaCrm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tarefasCrmApi.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tarefasCrmKeys.all });
      toast.success("Tarefa removida.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}
