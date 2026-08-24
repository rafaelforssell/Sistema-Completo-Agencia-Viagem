import { http } from "@/lib/http";
import type { Alerta, AtividadeFeed, DashboardMetricas } from "@/types/entities";

export const dashboardApi = {
  metricas: () => http.get<DashboardMetricas>("/dashboard/metricas"),
};

export const atividadesApi = {
  listar: (limite = 20) => http.get<AtividadeFeed[]>("/atividades", { limite }),
};

export interface AlertasFiltro {
  lido?: boolean;
  tipo?: string;
}

export const alertasApi = {
  listar: (params?: AlertasFiltro) => http.get<Alerta[]>("/alertas", params),
  marcarComoLido: (id: string) => http.patch<Alerta>(`/alertas/${id}/lido`),
  marcarTodosComoLidos: () => http.patch<{ ok: true }>("/alertas/lidos"),
  remover: (id: string) => http.delete<void>(`/alertas/${id}`),
};
