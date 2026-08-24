import { http } from "@/lib/http";
import type {
  PaginatedResponse,
  PaginationParams,
  Passageiro,
  PassageiroInput,
  Viagem,
  ViagemInput,
  VoucherResponse,
} from "@/types/entities";

export interface ViagensFiltro extends PaginationParams {
  status?: string;
  clienteId?: string;
}

export const viagensApi = {
  listar: (params?: ViagensFiltro) =>
    http.get<PaginatedResponse<Viagem>>("/viagens", params),
  obter: (id: string) => http.get<Viagem>(`/viagens/${id}`),
  criar: (input: ViagemInput) => http.post<Viagem>("/viagens", input),
  atualizar: (id: string, input: Partial<ViagemInput>) =>
    http.put<Viagem>(`/viagens/${id}`, input),
  remover: (id: string) => http.delete<void>(`/viagens/${id}`),

  gerarVoucher: (id: string) =>
    http.post<VoucherResponse>(`/viagens/${id}/voucher`),
};

export const passageirosApi = {
  listar: (viagemId: string) =>
    http.get<Passageiro[]>(`/viagens/${viagemId}/passageiros`),
  criar: (viagemId: string, input: PassageiroInput) =>
    http.post<Passageiro>(`/viagens/${viagemId}/passageiros`, input),
  atualizar: (viagemId: string, passageiroId: string, input: Partial<PassageiroInput>) =>
    http.put<Passageiro>(`/viagens/${viagemId}/passageiros/${passageiroId}`, input),
  remover: (viagemId: string, passageiroId: string) =>
    http.delete<void>(`/viagens/${viagemId}/passageiros/${passageiroId}`),
};
