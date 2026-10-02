import { Clock, TriangleAlert } from "lucide-react";
import { formatDuracao, minutosDeConexao } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TrechoConexao {
  destinoIata?: string;
  destinoAeroporto?: string;
  chegadaPrevista?: string;
  origemIata?: string;
  partidaPrevista?: string;
}

// Linha "Conexão em Lisboa (LIS) · 2h15 de espera" entre dois voos do mesmo
// sentido, com aviso se os horários ou aeroportos não fecharem.
export function ConexaoInfo({ anterior, proximo }: { anterior: TrechoConexao; proximo: TrechoConexao }) {
  const local = anterior.destinoAeroporto
    ? `${anterior.destinoAeroporto}${anterior.destinoIata ? ` (${anterior.destinoIata})` : ""}`
    : anterior.destinoIata;
  const espera = minutosDeConexao(anterior.chegadaPrevista, proximo.partidaPrevista);
  const aeroportoDiferente =
    Boolean(anterior.destinoIata && proximo.origemIata) &&
    anterior.destinoIata?.toUpperCase() !== proximo.origemIata?.toUpperCase();
  const problema =
    espera !== null && espera < 0
      ? "partida antes da chegada do voo anterior"
      : aeroportoDiferente
        ? `aeroportos diferentes (${anterior.destinoIata} → ${proximo.origemIata})`
        : null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 pl-3 text-xs",
        problema ? "text-destructive" : "text-warning-foreground dark:text-warning"
      )}
    >
      {problema ? <TriangleAlert className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      <span>
        Conexão{local ? ` em ${local}` : ""}
        {espera !== null && espera >= 0 && ` · ${formatDuracao(espera)} de espera`}
        {problema && ` · ${problema}`}
      </span>
    </div>
  );
}
