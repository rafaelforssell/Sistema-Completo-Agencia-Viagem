import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { anexosApi, AnexosFiltro, NovoAnexoInput } from "@/lib/api/anexos";
import { ApiError } from "@/lib/http";

export const anexosKeys = {
  lista: (params: AnexosFiltro) => ["anexos", params] as const,
};

export function useAnexos(params: AnexosFiltro) {
  return useQuery({
    queryKey: anexosKeys.lista(params),
    queryFn: () => anexosApi.listar(params),
    enabled: Boolean(params.clienteId || params.viagemId || params.passageiroId),
  });
}

export function useEnviarAnexo(params: AnexosFiltro) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NovoAnexoInput) => anexosApi.enviar(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: anexosKeys.lista(params) });
      toast.success("Documento enviado.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useRemoverAnexo(params: AnexosFiltro) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => anexosApi.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: anexosKeys.lista(params) });
      toast.success("Documento removido.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}
