import { http } from "@/lib/http";
import type { CarteiraMovimento, CarteiraMovimentoInput, CarteiraResumo } from "@/types/entities";

export const carteiraApi = {
  resumo: (fornecedorId: string) => http.get<CarteiraResumo>(`/fornecedores/${fornecedorId}/carteira`),
  adicionarMovimento: (fornecedorId: string, input: CarteiraMovimentoInput) =>
    http.post<CarteiraMovimento>(`/fornecedores/${fornecedorId}/carteira/movimentos`, input),
  removerMovimento: (fornecedorId: string, movimentoId: string) =>
    http.delete<void>(`/fornecedores/${fornecedorId}/carteira/movimentos/${movimentoId}`),
};
