"use client";

import Link from "next/link";
import {
  Activity,
  CreditCard,
  PlaneTakeoff,
  RefreshCcw,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { useAtividades } from "@/hooks/use-dashboard";
import { formatDate, formatDateTime } from "@/lib/format";
import type { AtividadeFeed, TipoAtividade } from "@/types/entities";

const TIPO_ICON: Record<TipoAtividade, LucideIcon> = {
  viagem_proxima: PlaneTakeoff,
  pagamento_pendente: CreditCard,
  reembolso_aberto: RefreshCcw,
  cliente_novo: UserPlus,
  viagem_concluida: PlaneTakeoff,
};

// "cliente_novo" e "viagem_concluida" carregam um instante real (criadoEm /
// atualizadoEm) — faz sentido mostrar a hora. Os demais carregam uma data de
// calendário pura (dataIda, vencimento, dataSolicitacao): mostrar um horário
// junto seria inventar uma informação que não existe.
const TIPOS_COM_HORARIO = new Set<TipoAtividade>(["cliente_novo", "viagem_concluida"]);

function formatAtividadeData(atividade: AtividadeFeed): string {
  return TIPOS_COM_HORARIO.has(atividade.tipo)
    ? formatDateTime(atividade.data)
    : formatDate(atividade.data);
}

function hrefFor(atividade: AtividadeFeed): string | null {
  if (!atividade.referenciaId) return null;
  if (atividade.referenciaTipo === "cliente") return `/clientes/${atividade.referenciaId}`;
  if (atividade.referenciaTipo === "viagem") return `/viagens/${atividade.referenciaId}`;
  return null;
}

export default function ResumoPage() {
  const { data: atividades, isLoading } = useAtividades(30);

  return (
    <div className="space-y-6">
      <PageHeader title="Resumo" description="O que está rolando na agência agora." />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !atividades || atividades.length === 0 ? (
            <EmptyState icon={Activity} title="Nenhuma atividade recente" description="Assim que houver movimentação, ela aparecerá aqui." />
          ) : (
            <ol className="relative space-y-0 border-l border-border pl-6">
              {atividades.map((atividade) => {
                const Icon = TIPO_ICON[atividade.tipo];
                const href = hrefFor(atividade);
                const content = (
                  <div className="pb-6">
                    <p className="text-sm font-medium">{atividade.titulo}</p>
                    <p className="text-sm text-muted-foreground">{atividade.descricao}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatAtividadeData(atividade)}</p>
                  </div>
                );

                return (
                  <li key={atividade.id} className="relative">
                    <span className="absolute -left-[29px] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </span>
                    {href ? (
                      <Link href={href} className="block rounded-md hover:bg-muted/50">
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
