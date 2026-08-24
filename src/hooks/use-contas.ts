import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { contasApi, ContaInput, ContasFiltro } from "@/lib/api/contas";
import { ApiError } from "@/lib/http";

export const contasKeys = {
  all: ["contas"] as const,
  lista: (params?: ContasFiltro) => [...contasKeys.all, "lista", params] as const,
  resumo: () => [...contasKeys.all, "resumo"] as const,
};

export function useContas(params?: ContasFiltro) {
  return useQuery({
    queryKey: contasKeys.lista(params),
    queryFn: () => contasApi.listar(params),
    placeholderData: (previous) => previous,
  });
}

export function useResumoFinanceiro() {
  return useQuery({
    queryKey: contasKeys.resumo(),
    queryFn: () => contasApi.resumo(),
  });
}

export function useCriarConta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ContaInput) => contasApi.criar(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasKeys.all });
      toast.success("Conta cadastrada.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useAtualizarConta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ContaInput> }) =>
      contasApi.atualizar(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasKeys.all });
      toast.success("Conta atualizada.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useRemoverConta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contasApi.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasKeys.all });
      toast.success("Conta removida.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}
