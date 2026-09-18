import { http } from "@/lib/http";
import type {
  PaginatedResponse,
  PaginationParams,
  Venda,
  VendaInput,
} from "@/types/entities";

export interface VendasFiltro extends PaginationParams {
  tipo?: string;
  status?: string;
  clienteId?: string;
}

export const vendasApi = {
  listar: (params?: VendasFiltro) => http.get<PaginatedResponse<Venda>>("/vendas", params),
  detalhe: (id: string) => http.get<Venda>(`/vendas/${id}`),
  criar: (input: VendaInput) => http.post<Venda>("/vendas", input),
  atualizar: (id: string, input: Partial<VendaInput>) => http.put<Venda>(`/vendas/${id}`, input),
  remover: (id: string) => http.delete<void>(`/vendas/${id}`),
};
