import { http } from "@/lib/http";
import type {
  ContaFinanceira,
  PaginatedResponse,
  PaginationParams,
  ResumoFinanceiro,
} from "@/types/entities";

export interface ContasFiltro extends PaginationParams {
  natureza?: string;
  status?: string;
}

export type ContaInput = Omit<
  ContaFinanceira,
  "id" | "criadoEm" | "atualizadoEm"
>;

export const contasApi = {
  listar: (params?: ContasFiltro) =>
    http.get<PaginatedResponse<ContaFinanceira>>("/contas", params),
  resumo: () => http.get<ResumoFinanceiro>("/contas/resumo"),
  criar: (input: ContaInput) => http.post<ContaFinanceira>("/contas", input),
  atualizar: (id: string, input: Partial<ContaInput>) =>
    http.put<ContaFinanceira>(`/contas/${id}`, input),
  remover: (id: string) => http.delete<void>(`/contas/${id}`),
};
