"use client";

import { Plane } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/common/status-badge";
import { formatDateTime } from "@/lib/format";
import type { DadosVoo, PontoVoo } from "@/lib/api/integracoes";

const STATUS_VOO_LABEL: Record<string, string> = {
  scheduled: "Agendado",
  active: "Em voo",
  landed: "Pousou",
  cancelled: "Cancelado",
  incident: "Incidente",
  diverted: "Desviado",
};

const STATUS_VOO_TONE: Record<string, StatusTone> = {
  scheduled: "info",
  active: "success",
  landed: "neutral",
  cancelled: "danger",
  incident: "danger",
  diverted: "warning",
};

function PontoInfo({ titulo, ponto }: { titulo: string; ponto: PontoVoo }) {
  return (
    <div className="space-y-1 text-sm">
      <p className="text-xs font-medium text-muted-foreground">{titulo}</p>
      <p className="font-medium">
        {ponto.aeroporto} ({ponto.iata})
      </p>
      <p className="text-muted-foreground">Previsto: {formatDateTime(ponto.horarioPrevisto)}</p>
      {ponto.horarioEstimado && <p className="text-muted-foreground">Estimado: {formatDateTime(ponto.horarioEstimado)}</p>}
      {ponto.horarioReal && <p className="text-muted-foreground">Real: {formatDateTime(ponto.horarioReal)}</p>}
      <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
        {ponto.terminal && <span>Terminal {ponto.terminal}</span>}
        {ponto.portao && <span>Portão {ponto.portao}</span>}
        {ponto.bagagem && <span>Esteira {ponto.bagagem}</span>}
        {typeof ponto.atrasoMinutos === "number" && ponto.atrasoMinutos > 0 && (
          <span className="text-destructive">{ponto.atrasoMinutos} min de atraso</span>
        )}
      </div>
    </div>
  );
}

export function VooResultadoCard({ dados }: { dados: DadosVoo }) {
  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {dados.voo.iata} · {dados.companhia.nome}
            </span>
          </div>
          <StatusBadge
            tone={STATUS_VOO_TONE[dados.status] ?? "neutral"}
            label={STATUS_VOO_LABEL[dados.status] ?? dados.status}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <PontoInfo titulo="Partida" ponto={dados.partida} />
          <PontoInfo titulo="Chegada" ponto={dados.chegada} />
        </div>

        {dados.aeronave && (dados.aeronave.registro || dados.aeronave.tipoIata) && (
          <p className="text-xs text-muted-foreground">
            Aeronave: {dados.aeronave.tipoIata ?? "—"} {dados.aeronave.registro ? `· ${dados.aeronave.registro}` : ""}
          </p>
        )}

        {dados.posicaoAtual && (
          <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Posição em tempo real</p>
            <p>
              Lat {dados.posicaoAtual.latitude.toFixed(2)}, Long {dados.posicaoAtual.longitude.toFixed(2)} · Altitude{" "}
              {Math.round(dados.posicaoAtual.altitude)}m · {Math.round(dados.posicaoAtual.velocidadeHorizontalKmh)} km/h
            </p>
            <p>Atualizado em {formatDateTime(dados.posicaoAtual.atualizadoEm)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
