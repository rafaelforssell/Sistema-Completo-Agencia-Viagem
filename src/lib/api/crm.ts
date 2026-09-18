import { http } from "@/lib/http";
import type {
  InteracaoCrm,
  InteracaoCrmInput,
  Lead,
  LeadInput,
  PaginatedResponse,
  PaginationParams,
  TarefaCrm,
  TarefaCrmInput,
} from "@/types/entities";

export interface LeadsFiltro extends PaginationParams {
  etapa?: string;
}

export const leadsApi = {
  listar: (params?: LeadsFiltro) => http.get<PaginatedResponse<Lead>>("/crm/leads", params),
  criar: (input: LeadInput) => http.post<Lead>("/crm/leads", input),
  atualizar: (id: string, input: Partial<LeadInput>) => http.put<Lead>(`/crm/leads/${id}`, input),
  atualizarEtapa: (id: string, etapa: string) =>
    http.patch<Lead>(`/crm/leads/${id}/etapa`, { etapa }),
  remover: (id: string) => http.delete<void>(`/crm/leads/${id}`),
};

export interface InteracoesFiltro {
  leadId?: string;
  clienteId?: string;
}

export const interacoesCrmApi = {
  listar: (params: InteracoesFiltro) => http.get<InteracaoCrm[]>("/crm/interacoes", params),
  criar: (input: InteracaoCrmInput) => http.post<InteracaoCrm>("/crm/interacoes", input),
  remover: (id: string) => http.delete<void>(`/crm/interacoes/${id}`),
};

export interface TarefasFiltro {
  leadId?: string;
  clienteId?: string;
  concluida?: boolean;
}

export const tarefasCrmApi = {
  listar: (params?: TarefasFiltro) => http.get<TarefaCrm[]>("/crm/tarefas", params),
  criar: (input: TarefaCrmInput) => http.post<TarefaCrm>("/crm/tarefas", input),
  atualizar: (id: string, input: Partial<TarefaCrmInput>) =>
    http.put<TarefaCrm>(`/crm/tarefas/${id}`, input),
  remover: (id: string) => http.delete<void>(`/crm/tarefas/${id}`),
};
