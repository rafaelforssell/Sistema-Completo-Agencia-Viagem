"use client";

import Link from "next/link";
import { CalendarDays, ExternalLink, Mail, Phone, Plane, ShoppingBag, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StatusTone } from "@/components/common/status-badge";
import {
  ContasSecao,
  PagamentosSecao,
  Secao,
  Tabela,
  Totais,
} from "@/components/viagens/viagem-resumo";
import { useVenda } from "@/hooks/use-vendas";
import { useViagemResumo } from "@/hooks/use-viagens";
import { STATUS_VENDA_LABEL, STATUS_VIAGEM_LABEL, TIPO_VENDA_LABEL } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { StatusVenda } from "@/types/entities";

const STATUS_TONE: Record<StatusVenda, StatusTone> = {
  orcamento: "neutral",
  confirmada: "success",
  cancelada: "danger",
};

// Resumo completo de uma venda: cliente, viagem, itens com fornecedor e, se
// houver viagem vinculada, os pagamentos, contas e totais dela.
export function VendaResumo({ vendaId }: { vendaId: string }) {
  const { data: venda, isLoading } = useVenda(vendaId);
  const { data: viagemResumo } = useViagemResumo(venda?.viagemId);

  if (isLoading || !venda) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const { cliente, viagem } = venda;

  return (
    <div className="space-y-6 text-sm">
      <header className="space-y-2 border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Resumo da venda</p>
            <h2 className="font-display text-xl font-semibold">Pedido {venda.numeroPedido}</h2>
            <p className="text-muted-foreground">Vendida em {formatDate(venda.dataVenda)}</p>
          </div>
          <div className="text-right">
            <StatusBadge tone={STATUS_TONE[venda.status]} label={STATUS_VENDA_LABEL[venda.status]} />
            <p className="mt-1 font-display text-2xl font-semibold">{formatCurrency(venda.valorTotal)}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Secao titulo="Cliente" icone={User}>
          <div className="space-y-1">
            <Link href={`/clientes/${cliente.id}`} className="inline-flex items-center gap-1 font-medium hover:underline">
              {cliente.nome}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            {cliente.telefone && (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {`${cliente.telefoneDdi ?? ""} ${cliente.telefone}`.trim()}
              </p>
            )}
            {cliente.email && (
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {cliente.email}
              </p>
            )}
          </div>
        </Secao>

        <Secao titulo="Viagem" icone={Plane}>
          {viagem ? (
            <div className="space-y-1">
              <Link href={`/viagens/${viagem.id}`} className="inline-flex items-center gap-1 font-medium hover:underline">
                {viagem.destino}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <p className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(viagem.dataIda)} – {formatDate(viagem.dataVolta)} · {STATUS_VIAGEM_LABEL[viagem.status]}
              </p>
              {viagem.localizador && (
                <p className="text-muted-foreground">
                  Localizador: <span className="font-mono text-foreground">{viagem.localizador}</span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Venda sem viagem vinculada.</p>
          )}
        </Secao>
      </div>

      <Secao titulo="Itens vendidos" icone={ShoppingBag}>
        <Tabela
          cabecalho={["Item", "Fornecedor", "Valor"]}
          alinharUltimaDireita
          linhas={venda.itens.map((item) => [
            <span key="i">
              <span className="font-medium">{TIPO_VENDA_LABEL[item.tipo]}</span>
              {item.descricao && <span className="text-muted-foreground"> · {item.descricao}</span>}
              {item.tipo === "aluguel_carro" && (item.dataAluguel || item.seguroCompleto !== undefined) && (
                <span className="block text-xs text-muted-foreground">
                  {item.dataAluguel && `Retirada em ${formatDate(item.dataAluguel)}`}
                  {item.dataAluguel && item.seguroCompleto !== undefined && " · "}
                  {item.seguroCompleto !== undefined && (item.seguroCompleto ? "Seguro completo" : "Sem seguro completo")}
                </span>
              )}
            </span>,
            item.fornecedorNome || "—",
            formatCurrency(item.valor),
          ])}
        />
        {venda.numeroPedidoExtras.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Referências:{" "}
            {venda.numeroPedidoExtras.map((e) => (e.descricao ? `${e.descricao}: ${e.numero}` : e.numero)).join(" · ")}
          </p>
        )}
      </Secao>

      {venda.observacoes && (
        <Secao titulo="Observações">
          <p className="whitespace-pre-line text-muted-foreground">{venda.observacoes}</p>
        </Secao>
      )}

      {viagemResumo && (
        <>
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Financeiro da viagem</p>
            <Totais totais={viagemResumo.totais} />
          </div>
          <PagamentosSecao pagamentos={viagemResumo.pagamentos} />
          <ContasSecao contas={viagemResumo.contas} />
        </>
      )}
    </div>
  );
}
