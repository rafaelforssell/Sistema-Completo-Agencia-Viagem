import { Router } from "express";
import { env } from "../../env";
import { HttpError } from "../../lib/http-error";
import { asyncHandler } from "../../middleware/async-handler";

// O plano gratuito da Aviationstack só aceita chamadas HTTP (não HTTPS) —
// limitação deles, não nossa. Ver docs.apilayer.com/aviationstack.
const AVIATIONSTACK_BASE_URL = "http://api.aviationstack.com/v1/flights";

interface AviationstackPonto {
  airport: string;
  timezone?: string;
  iata: string;
  icao?: string;
  terminal?: string | null;
  gate?: string | null;
  baggage?: string | null;
  delay?: number | null;
  scheduled: string;
  estimated?: string | null;
  actual?: string | null;
  estimated_runway?: string | null;
  actual_runway?: string | null;
}

interface AviationstackFlight {
  flight_date: string;
  flight_status: string;
  departure: AviationstackPonto;
  arrival: AviationstackPonto;
  airline: { name: string; iata?: string; icao?: string };
  flight: { number: string; iata: string; icao?: string; codeshared?: unknown };
  aircraft?: { registration?: string | null; iata?: string | null; icao?: string | null; icao24?: string | null } | null;
  live?: {
    updated: string;
    latitude: number;
    longitude: number;
    altitude: number;
    direction: number;
    speed_horizontal: number;
    speed_vertical: number;
    is_ground: boolean;
  } | null;
}

interface AviationstackResponse {
  data?: AviationstackFlight[];
  error?: { code: number; type: string; info: string };
}

function serializePonto(ponto: AviationstackPonto) {
  return {
    aeroporto: ponto.airport,
    iata: ponto.iata,
    icao: ponto.icao ?? undefined,
    terminal: ponto.terminal ?? undefined,
    portao: ponto.gate ?? undefined,
    bagagem: ponto.baggage ?? undefined,
    atrasoMinutos: ponto.delay ?? undefined,
    horarioPrevisto: ponto.scheduled,
    horarioEstimado: ponto.estimated ?? undefined,
    horarioReal: ponto.actual ?? undefined,
  };
}

export const voosRouter = Router();

voosRouter.get(
  "/:numero",
  asyncHandler(async (req, res) => {
    if (!env.aviationstackApiKey) {
      throw HttpError.badRequest(
        "Busca por número de voo não está configurada. Peça para o administrador definir AVIATIONSTACK_API_KEY."
      );
    }

    const numero = req.params.numero.trim().toUpperCase();
    const url = `${AVIATIONSTACK_BASE_URL}?access_key=${env.aviationstackApiKey}&flight_iata=${encodeURIComponent(numero)}`;

    const response = await fetch(url);
    const body = (await response.json()) as AviationstackResponse;

    if (body.error) {
      throw HttpError.badRequest(`Aviationstack: ${body.error.info}`);
    }

    const voo = body.data?.[0];
    if (!voo) {
      throw HttpError.notFound(`Nenhum voo encontrado para o número "${numero}".`);
    }

    res.json({
      // Campos resumidos, usados pra pré-preencher o formulário de viagem.
      numeroVoo: voo.flight.iata,
      companhiaAerea: voo.airline.name,
      aeroportoOrigem: voo.departure.airport,
      aeroportoDestino: voo.arrival.airport,
      dataIda: voo.departure.scheduled?.slice(0, 10),
      horarioPartida: voo.departure.scheduled,
      horarioChegada: voo.arrival.scheduled,

      // Tudo que a Aviationstack retorna, pra exibir como conferência —
      // não é salvo na viagem, só mostrado na tela de busca.
      status: voo.flight_status,
      companhia: {
        nome: voo.airline.name,
        iata: voo.airline.iata ?? undefined,
        icao: voo.airline.icao ?? undefined,
      },
      voo: {
        numero: voo.flight.number,
        iata: voo.flight.iata,
        icao: voo.flight.icao ?? undefined,
      },
      aeronave: voo.aircraft
        ? {
            registro: voo.aircraft.registration ?? undefined,
            tipoIata: voo.aircraft.iata ?? undefined,
            tipoIcao: voo.aircraft.icao ?? undefined,
          }
        : undefined,
      partida: serializePonto(voo.departure),
      chegada: serializePonto(voo.arrival),
      posicaoAtual: voo.live
        ? {
            atualizadoEm: voo.live.updated,
            latitude: voo.live.latitude,
            longitude: voo.live.longitude,
            altitude: voo.live.altitude,
            direcao: voo.live.direction,
            velocidadeHorizontalKmh: voo.live.speed_horizontal,
            velocidadeVerticalKmh: voo.live.speed_vertical,
            noSolo: voo.live.is_ground,
          }
        : undefined,
    });
  })
);
