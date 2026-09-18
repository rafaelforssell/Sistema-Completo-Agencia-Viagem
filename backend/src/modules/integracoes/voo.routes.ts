import { Router } from "express";
import { env } from "../../env";
import { HttpError } from "../../lib/http-error";
import { asyncHandler } from "../../middleware/async-handler";

// O plano gratuito da Aviationstack só aceita chamadas HTTP (não HTTPS) —
// limitação deles, não nossa. Ver docs.apilayer.com/aviationstack.
const AVIATIONSTACK_BASE_URL = "http://api.aviationstack.com/v1/flights";

interface AviationstackFlight {
  flight_date: string;
  departure: { airport: string; iata: string; scheduled: string };
  arrival: { airport: string; iata: string; scheduled: string };
  airline: { name: string };
  flight: { iata: string };
}

interface AviationstackResponse {
  data?: AviationstackFlight[];
  error?: { code: number; type: string; info: string };
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
      numeroVoo: voo.flight.iata,
      companhiaAerea: voo.airline.name,
      aeroportoOrigem: voo.departure.airport,
      aeroportoDestino: voo.arrival.airport,
      dataIda: voo.departure.scheduled?.slice(0, 10),
      horarioPartida: voo.departure.scheduled,
      horarioChegada: voo.arrival.scheduled,
    });
  })
);
