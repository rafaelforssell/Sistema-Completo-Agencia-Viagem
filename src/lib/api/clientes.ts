import { http } from "@/lib/http";
import type {
  Cliente,
  ClienteInput,
  PaginatedResponse,
  PaginationParams,
} from "@/types/entities";

export const clientesApi = {
  listar: (params?: PaginationParams) =>
    http.get<PaginatedResponse<Cliente>>("/clientes", params),
  obter: (id: string) => http.get<Cliente>(`/clientes/${id}`),
  criar: (input: ClienteInput) => http.post<Cliente>("/clientes", input),
  atualizar: (id: string, input: Partial<ClienteInput>) =>
    http.put<Cliente>(`/clientes/${id}`, input),
  remover: (id: string) => http.delete<void>(`/clientes/${id}`),
};
