import { http } from "@/lib/http";

export interface DadosVoo {
  numeroVoo: string;
  companhiaAerea: string;
  aeroportoOrigem: string;
  aeroportoDestino: string;
  dataIda: string;
  horarioPartida: string;
  horarioChegada: string;
}

export const integracoesApi = {
  buscarVoo: (numero: string) => http.get<DadosVoo>(`/integracoes/voo/${encodeURIComponent(numero)}`),
};
