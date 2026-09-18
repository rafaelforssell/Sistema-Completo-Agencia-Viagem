import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { interacoesCrmApi, InteracoesFiltro } from "@/lib/api/crm";
import { ApiError } from "@/lib/http";
import type { InteracaoCrmInput } from "@/types/entities";

export const interacoesCrmKeys = {
  all: ["crm", "interacoes"] as const,
  lista: (params: InteracoesFiltro) => [...interacoesCrmKeys.all, "lista", params] as const,
};

export function useInteracoesCrm(params: InteracoesFiltro) {
  return useQuery({
    queryKey: interacoesCrmKeys.lista(params),
    queryFn: () => interacoesCrmApi.listar(params),
    enabled: Boolean(params.leadId || params.clienteId),
  });
}

export function useCriarInteracaoCrm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InteracaoCrmInput) => interacoesCrmApi.criar(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interacoesCrmKeys.all });
      toast.success("Interação registrada.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useRemoverInteracaoCrm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => interacoesCrmApi.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interacoesCrmKeys.all });
      toast.success("Interação removida.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}
