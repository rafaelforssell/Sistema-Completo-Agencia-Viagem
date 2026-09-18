import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { integracoesApi } from "@/lib/api/integracoes";
import { ApiError } from "@/lib/http";

export function useBuscarVoo() {
  return useMutation({
    mutationFn: (numero: string) => integracoesApi.buscarVoo(numero),
    onError: (error: ApiError) => toast.error(error.message),
  });
}
