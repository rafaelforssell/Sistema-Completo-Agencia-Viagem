import { http } from "@/lib/http";
import type {
  Comissao,
  ComissaoInput,
  PaginatedResponse,
  PaginationParams,
} from "@/types/entities";

export interface ComissoesFiltro extends PaginationParams {
  status?: string;
  viagemId?: string;
}

export const comissoesApi = {
  listar: (params?: ComissoesFiltro) =>
    http.get<PaginatedResponse<Comissao>>("/comissoes", params),
  criar: (input: ComissaoInput) => http.post<Comissao>("/comissoes", input),
  atualizar: (id: string, input: Partial<ComissaoInput>) =>
    http.put<Comissao>(`/comissoes/${id}`, input),
  remover: (id: string) => http.delete<void>(`/comissoes/${id}`),
};
