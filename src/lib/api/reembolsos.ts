import { http } from "@/lib/http";
import type {
  PaginatedResponse,
  PaginationParams,
  Reembolso,
  ReembolsoInput,
} from "@/types/entities";

export interface ReembolsosFiltro extends PaginationParams {
  status?: string;
  viagemId?: string;
}

export const reembolsosApi = {
  listar: (params?: ReembolsosFiltro) =>
    http.get<PaginatedResponse<Reembolso>>("/reembolsos", params),
  listarPorViagem: (viagemId: string) =>
    http.get<Reembolso[]>(`/viagens/${viagemId}/reembolsos`),
  criar: (viagemId: string, input: ReembolsoInput) =>
    http.post<Reembolso>(`/viagens/${viagemId}/reembolsos`, input),
  atualizar: (id: string, input: Partial<ReembolsoInput>) =>
    http.put<Reembolso>(`/reembolsos/${id}`, input),
  remover: (id: string) => http.delete<void>(`/reembolsos/${id}`),
};
