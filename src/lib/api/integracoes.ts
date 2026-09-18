import { http } from "@/lib/http";

export interface PontoVoo {
  aeroporto: string;
  iata: string;
  icao?: string;
  terminal?: string;
  portao?: string;
  bagagem?: string;
  atrasoMinutos?: number;
  horarioPrevisto: string;
  horarioEstimado?: string;
  horarioReal?: string;
}

export interface PosicaoAtualVoo {
  atualizadoEm: string;
  latitude: number;
  longitude: number;
  altitude: number;
  direcao: number;
  velocidadeHorizontalKmh: number;
  velocidadeVerticalKmh: number;
  noSolo: boolean;
}

export interface DadosVoo {
  // Resumo usado pra pré-preencher o formulário de viagem.
  numeroVoo: string;
  companhiaAerea: string;
  aeroportoOrigem: string;
  aeroportoDestino: string;
  dataIda: string;
  horarioPartida: string;
  horarioChegada: string;

  // Detalhe completo retornado pela Aviationstack, só pra conferência.
  status: string;
  companhia: { nome: string; iata?: string; icao?: string };
  voo: { numero: string; iata: string; icao?: string };
  aeronave?: { registro?: string; tipoIata?: string; tipoIcao?: string };
  partida: PontoVoo;
  chegada: PontoVoo;
  posicaoAtual?: PosicaoAtualVoo;
}

export const integracoesApi = {
  buscarVoo: (numero: string) => http.get<DadosVoo>(`/integracoes/voo/${encodeURIComponent(numero)}`),
};
