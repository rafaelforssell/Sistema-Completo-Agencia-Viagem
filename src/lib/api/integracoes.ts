import { http } from "@/lib/http";

export interface PontoVoo {
  aeroporto: string;
  cidade?: string;
  iata: string;
  icao?: string;
  terminal?: string;
  portao?: string;
  bagagem?: string;
  atrasoMinutos?: number;
  // Hora local do aeroporto, "AAAA-MM-DDTHH:mm" (a hora do bilhete).
  horarioPrevisto?: string;
  horarioEstimado?: string;
}

// GET /integracoes/voo/:numero?data= — dados do voo via AeroDataBox, usados
// pra pré-preencher um trecho da viagem.
export interface DadosVoo {
  status: string;
  companhia: { nome: string; iata?: string; icao?: string };
  voo: { numero: string; iata: string; codeshare: boolean };
  aeronave?: { registro?: string; modelo?: string };
  partida: PontoVoo;
  chegada: PontoVoo;
}

export const integracoesApi = {
  buscarVoo: (numero: string, data: string) =>
    http.get<DadosVoo>(`/integracoes/voo/${encodeURIComponent(numero)}?data=${encodeURIComponent(data)}`),
};
