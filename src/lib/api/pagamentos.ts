import { http } from "@/lib/http";
import type { Pagamento, PagamentoInput } from "@/types/entities";

export const pagamentosApi = {
  listarPorViagem: (viagemId: string) =>
    http.get<Pagamento[]>(`/viagens/${viagemId}/pagamentos`),
  criar: (viagemId: string, input: PagamentoInput) =>
    http.post<Pagamento>(`/viagens/${viagemId}/pagamentos`, input),
  atualizar: (id: string, input: Partial<PagamentoInput>) =>
    http.put<Pagamento>(`/pagamentos/${id}`, input),
  remover: (id: string) => http.delete<void>(`/pagamentos/${id}`),
};
