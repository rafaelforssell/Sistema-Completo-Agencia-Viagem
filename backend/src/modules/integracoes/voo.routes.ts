import { Router } from "express";
import { env } from "../../env";
import { HttpError } from "../../lib/http-error";
import { asyncHandler } from "../../middleware/async-handler";

// AeroDataBox via RapidAPI (aerodatabox.com). Diferente da Aviationstack
// gratuita (que só conhecia os voos do dia), ela busca voo por número + data,
// inclusive datas futuras, e devolve o horário local de cada aeroporto.
const AERODATABOX_HOST = "aerodatabox.p.rapidapi.com";

interface AeroDataBoxHorario {
  utc: string; // "2026-11-20 13:05Z"
  local: string; // "2026-11-20 10:05-03:00"
}

interface AeroDataBoxPonto {
  airport: {
    name: string;
    shortName?: string;
    municipalityName?: string;
    iata?: string;
    icao?: string;
    countryCode?: string;
    timeZone?: string;
  };
  scheduledTime?: AeroDataBoxHorario;
  revisedTime?: AeroDataBoxHorario; // horário atualizado (perto do voo)
  predictedTime?: AeroDataBoxHorario; // previsão estatística
  runwayTime?: AeroDataBoxHorario;
  terminal?: string;
  checkInDesk?: string;
  gate?: string;
  baggageBelt?: string;
}

interface AeroDataBoxVoo {
  number: string; // "LA 3400"
  status: string;
  codeshareStatus?: "IsOperator" | "IsCodeshared" | "Unknown";
  departure: AeroDataBoxPonto;
  arrival: AeroDataBoxPonto;
  airline?: { name: string; iata?: string; icao?: string };
  aircraft?: { reg?: string; modeS?: string; model?: string };
}

// "2026-11-20 10:05-03:00" → "2026-11-20T10:05": a hora do bilhete, no fuso do
// aeroporto, que é como os trechos são salvos.
function horaLocal(horario?: AeroDataBoxHorario) {
  return horario?.local ? horario.local.slice(0, 16).replace(" ", "T") : undefined;
}

function minutosDeAtraso(ponto: AeroDataBoxPonto) {
  const estimado = ponto.revisedTime ?? ponto.predictedTime;
  if (!ponto.scheduledTime?.utc || !estimado?.utc) return undefined;
  const diff = Date.parse(estimado.utc.replace(" ", "T")) - Date.parse(ponto.scheduledTime.utc.replace(" ", "T"));
  return Number.isNaN(diff) ? undefined : Math.round(diff / 60000);
}

function serializePonto(ponto: AeroDataBoxPonto) {
  return {
    // "São Paulo Guarulhos - Governador André Franco Montoro" → "São Paulo Guarulhos"
    aeroporto: ponto.airport.name.split(" - ")[0],
    cidade: ponto.airport.municipalityName,
    iata: ponto.airport.iata ?? "",
    icao: ponto.airport.icao,
    terminal: ponto.terminal,
    portao: ponto.gate,
    bagagem: ponto.baggageBelt,
    atrasoMinutos: minutosDeAtraso(ponto),
    horarioPrevisto: horaLocal(ponto.scheduledTime),
    horarioEstimado: horaLocal(ponto.revisedTime ?? ponto.predictedTime),
  };
}

export const voosRouter = Router();

voosRouter.get(
  "/:numero",
  asyncHandler(async (req, res) => {
    if (!env.aerodataboxApiKey) {
      throw HttpError.badRequest(
        "Busca por número de voo não está configurada. Peça para o administrador definir AERODATABOX_API_KEY."
      );
    }

    const numero = req.params.numero.replace(/\s+/g, "").toUpperCase();
    const data = typeof req.query.data === "string" ? req.query.data.slice(0, 10) : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      throw HttpError.badRequest("Informe a data do voo (horário de partida ou data da viagem) para buscar.");
    }

    const url =
      `https://${AERODATABOX_HOST}/flights/number/${encodeURIComponent(numero)}/${data}` +
      "?withAircraftImage=false&withLocation=false&dateLocalRole=Departure";
    const response = await fetch(url, {
      headers: { "X-RapidAPI-Key": env.aerodataboxApiKey, "X-RapidAPI-Host": AERODATABOX_HOST },
    });

    if (response.status === 204 || response.status === 404) {
      throw HttpError.notFound(`Nenhum voo ${numero} encontrado partindo em ${data.split("-").reverse().join("/")}.`);
    }
    if (response.status === 401 || response.status === 403) {
      throw HttpError.badRequest("AeroDataBox recusou a chave (AERODATABOX_API_KEY inválida ou sem assinatura).");
    }
    if (response.status === 429) {
      throw HttpError.badRequest("Limite de buscas da AeroDataBox atingido. Tente de novo mais tarde.");
    }
    if (!response.ok) {
      throw HttpError.badRequest(`AeroDataBox respondeu com erro (${response.status}). Tente de novo.`);
    }

    const voos = (await response.json()) as AeroDataBoxVoo[];
    // Um mesmo número pode ter vários trechos no dia (voo com escala). Fica com
    // o primeiro a partir, que é o que o cliente normalmente embarca.
    const voo = [...voos].sort((a, b) =>
      (a.departure.scheduledTime?.utc ?? "").localeCompare(b.departure.scheduledTime?.utc ?? "")
    )[0];
    if (!voo) {
      throw HttpError.notFound(`Nenhum voo ${numero} encontrado partindo em ${data.split("-").reverse().join("/")}.`);
    }

    res.json({
      status: voo.status,
      companhia: {
        nome: voo.airline?.name ?? "",
        iata: voo.airline?.iata,
        icao: voo.airline?.icao,
      },
      voo: {
        numero: voo.number,
        iata: voo.number.replace(/\s+/g, ""),
        codeshare: voo.codeshareStatus === "IsCodeshared",
      },
      aeronave: voo.aircraft ? { registro: voo.aircraft.reg, modelo: voo.aircraft.model } : undefined,
      partida: serializePonto(voo.departure),
      chegada: serializePonto(voo.arrival),
    });
  })
);
