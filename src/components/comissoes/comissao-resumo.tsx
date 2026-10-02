"use client";

import Link from "next/link";
import { CalendarDays, ExternalLink, Plane, ShoppingBag, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StatusTone } from "@/components/common/status-badge";
import { Itinerario, Secao, Tabela } from "@/components/viagens/viagem-resumo";
import { useViagem } from "@/hooks/use-viagens";
import {
  STATUS_COMISSAO_LABEL,
  STATUS_VENDA_LABEL,
  STATUS_VIAGEM_LABEL,
  TIPO_VENDA_LABEL,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Comissao, StatusComissao } from "@/types/entities";

const STATUS_TONE: Record<StatusComissao, StatusTone> = {
  pendente: "warning",
  recebida: "success",
  cancelada: "danger",
};

// Resumo de uma comissão com a origem dela: a viagem, o cliente e a(s)
// venda(s) que geraram a comissão.
export function ComissaoResumo({ comissao }: { comissao: Comissao }) {
  const { data: viagem, isLoading } = useViagem(comissao.viagemId);

  const vendasValidas = (viagem?.vendas ?? []).filter((v) => v.status !== "cancelada");
  const totalVendido = vendasValidas.reduce((soma, v) => soma + v.valorTotal, 0);
  const percentualSobreVenda = totalVendido > 0 ? (comissao.valor / totalVendido) * 100 : null;

  return (
    <div className="space-y-6 text-sm">
      <header className="space-y-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Resumo da comissão</p>
            <p className="font-display text-2xl font-semibold">{formatCurrency(comissao.valor)}</p>
            {comissao.fornecedor && <p className="text-muted-foreground">Fornecedor: {comissao.fornecedor}</p>}
          </div>
          <StatusBadge tone={STATUS_TONE[comissao.status]} label={STATUS_COMISSAO_LABEL[comissao.status]} />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            Previsão: {formatDate(comissao.dataPrevista)}
          </span>
          {comissao.dataRecebimento && <span>Recebida em {formatDate(comissao.dataRecebimento)}</span>}
          {percentualSobreVenda !== null && (
            <span>
              Equivale a{" "}
              <span className="font-medium text-foreground">
                {percentualSobreVenda.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
              </span>{" "}
              do total vendido
            </span>
          )}
        </div>
      </header>

      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">De onde veio</p>

      {isLoading || !viagem ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Secao titulo="Viagem" icone={Plane}>
              <div className="space-y-1">
                <Link href={`/viagens/${viagem.id}`} className="inline-flex items-center gap-1 font-medium hover:underline">
                  {viagem.destino}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <p className="text-muted-foreground">
                  {formatDate(viagem.dataIda)} – {formatDate(viagem.dataVolta)} · {STATUS_VIAGEM_LABEL[viagem.status]}
                </p>
                {viagem.localizador && (
                  <p className="text-muted-foreground">
                    Localizador: <span className="font-mono text-foreground">{viagem.localizador}</span>
                  </p>
                )}
              </div>
            </Secao>

            {viagem.cliente && (
              <Secao titulo="Cliente" icone={User}>
                <Link
                  href={`/clientes/${viagem.cliente.id}`}
                  className="inline-flex items-center gap-1 font-medium hover:underline"
                >
                  {viagem.cliente.nome}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Secao>
            )}
          </div>

          <Secao titulo="Venda(s) que geraram a comissão" icone={ShoppingBag}>
            {(viagem.vendas ?? []).length === 0 ? (
              <p className="text-muted-foreground">Nenhuma venda vinculada a esta viagem.</p>
            ) : (
              <Tabela
                cabecalho={["Pedido", "Itens", "Status", "Total"]}
                alinharUltimaDireita
                linhas={(viagem.vendas ?? []).map((venda) => [
                  <span key="p" className="font-medium">
                    {venda.numeroPedido}
                  </span>,
                  venda.itens
                    .map((item) => (item.descricao ? `${TIPO_VENDA_LABEL[item.tipo]} (${item.descricao})` : TIPO_VENDA_LABEL[item.tipo]))
                    .join(", ") || "—",
                  STATUS_VENDA_LABEL[venda.status],
                  formatCurrency(venda.valorTotal),
                ])}
              />
            )}
          </Secao>

          {(viagem.trechos ?? []).length > 0 && (
            <Secao titulo="Voos" icone={Plane}>
              <Itinerario trechos={viagem.trechos ?? []} />
            </Secao>
          )}
        </>
      )}
    </div>
  );
}
