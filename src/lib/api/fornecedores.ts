import { http } from "@/lib/http";
import type {
  Fornecedor,
  FornecedorInput,
  PaginatedResponse,
  PaginationParams,
} from "@/types/entities";

export interface FornecedoresFiltro extends PaginationParams {
  tipo?: string;
}

export const fornecedoresApi = {
  listar: (params?: FornecedoresFiltro) =>
    http.get<PaginatedResponse<Fornecedor>>("/fornecedores", params),
  criar: (input: FornecedorInput) => http.post<Fornecedor>("/fornecedores", input),
  atualizar: (id: string, input: Partial<FornecedorInput>) =>
    http.put<Fornecedor>(`/fornecedores/${id}`, input),
  remover: (id: string) => http.delete<void>(`/fornecedores/${id}`),
};
