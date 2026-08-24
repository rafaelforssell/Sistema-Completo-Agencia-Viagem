import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { alertasApi, AlertasFiltro, atividadesApi, dashboardApi } from "@/lib/api/dashboard";
import { ApiError } from "@/lib/http";

export function useDashboardMetricas() {
  return useQuery({
    queryKey: ["dashboard", "metricas"],
    queryFn: () => dashboardApi.metricas(),
  });
}

export function useAtividades(limite = 20) {
  return useQuery({
    queryKey: ["atividades", limite],
    queryFn: () => atividadesApi.listar(limite),
  });
}

export function useAlertas(params?: AlertasFiltro) {
  return useQuery({
    queryKey: ["alertas", params],
    queryFn: () => alertasApi.listar(params),
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useMarcarAlertaLido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertasApi.marcarComoLido(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useMarcarTodosAlertasLidos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => alertasApi.marcarTodosComoLidos(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
      toast.success("Todos os alertas foram marcados como lidos.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}

export function useRemoverAlerta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertasApi.remover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertas"] });
      toast.success("Alerta removido.");
    },
    onError: (error: ApiError) => toast.error(error.message),
  });
}
