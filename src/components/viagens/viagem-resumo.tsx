"use client";

import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  ExternalLink,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Printer,
  ShoppingBag,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StatusTone } from "@/components/common/status-badge";
import { useViagemResumo } from "@/hooks/use-viagens";
import {
  FORMA_PAGAMENTO_LABEL,
  NATUREZA_CONTA_LABEL,
  STATUS_COMISSAO_LABEL,
  STATUS_CONTA_LABEL,
  STATUS_REEMBOLSO_LABEL,
  STATUS_VENDA_LABEL,
  STATUS_VIAGEM_LABEL,
  TIPO_VENDA_LABEL,
  origemPagamentoLabel,
} from "@/lib/constants";
import { formatCurrency, formatDate, formatHorarioVoo } from "@/lib/format";
import type { ContaFinanceira, Pagamento, StatusConta, StatusViagem, VooTrecho } from "@/types/entities";

const STATUS_VIAGEM_TONE: Record<StatusViagem, StatusTone> = {
  orcamento: "neutral",
  confirmada: "info",
  em_andamento: "warning",
  concluida: "success",
  cancelada: "danger",
};

const STATUS_CONTA_TONE: Record<StatusConta, StatusTone> = {
  pendente: "warning",
  pago: "success",
  atrasado: "danger",
  cancelado: "neutral",
};

interface ViagemResumoProps {
  viagemId: string;
  // Mostra os botões (imprimir / abrir viagem). Desligado na própria página
  // de impressão.
  acoes?: boolean;
}

// Guia completo da viagem para o cliente: itinerário, passageiros, o que foi
// comprado, como foi pago, contas e comissão.
export function ViagemResumo({ viagemId, acoes = true }: ViagemResumoProps) {
  const { data: resumo, isLoading } = useViagemResumo(viagemId);

  if (isLoading || !resumo) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const itens = resumo.vendas.flatMap((venda) =>
    venda.itens.map((item) => ({ ...item, numeroPedido: venda.numeroPedido, statusVenda: venda.status }))
  );

  return (
    <div className="space-y-6 text-sm">
      <header className="space-y-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Resumo da viagem</p>
            <h2 className="font-display text-xl font-semibold">{resumo.destino}</h2>
            <p className="text-muted-foreground">{resumo.cliente.nome}</p>
          </div>
          <StatusBadge tone={STATUS_VIAGEM_TONE[resumo.status]} label={STATUS_VIAGEM_LABEL[resumo.status]} />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {formatDate(resumo.dataIda)} – {formatDate(resumo.dataVolta)}
          </span>
          {resumo.companhiaAerea && (
            <span className="flex items-center gap-1.5">
              <Plane className="h-4 w-4" />
              {resumo.companhiaAerea}
            </span>
          )}
          {resumo.localizador && (
            <span>
              Localizador: <span className="font-mono font-medium text-foreground">{resumo.localizador}</span>
            </span>
          )}
        </div>
        {acoes && (
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" size="sm" asChild>
              <a href={`/viagens/${resumo.id}/resumo?imprimir=1`} target="_blank" rel="noreferrer">
                <Printer className="h-4 w-4" />
                Imprimir / PDF
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/viagens/${resumo.id}`}>
                <ExternalLink className="h-4 w-4" />
                Abrir viagem
              </Link>
            </Button>
          </div>
        )}
      </header>

      <Totais totais={resumo.totais} />

      <Secao titulo="Itinerário" icone={Plane}>
        <Itinerario trechos={resumo.trechos} />
      </Secao>

      <Secao titulo={`Passageiros (${resumo.passageiros.length})`} icone={Users}>
        {resumo.passageiros.length === 0 ? (
          <Vazio>Nenhum passageiro cadastrado.</Vazio>
        ) : (
          <Tabela
            cabecalho={["Nome", "Nascimento", "Passaporte", "Validade", "Bilhete"]}
            linhas={resumo.passageiros.map((p) => [
              <span key="n">
                <span className="font-medium">{p.nome}</span>
                {p.parentesco && <span className="text-muted-foreground"> · {p.parentesco}</span>}
              </span>,
              formatDate(p.dataNascimento),
              p.numeroPassaporte || "—",
              formatDate(p.validadePassaporte),
              p.numeroBilhete || "—",
            ])}
          />
        )}
      </Secao>

      <Secao titulo="O que foi comprado" icone={ShoppingBag}>
        {itens.length === 0 ? (
          <Vazio>Nenhuma venda registrada.</Vazio>
        ) : (
          <>
            <Tabela
              cabecalho={["Item", "Fornecedor", "Pedido", "Valor"]}
              alinharUltimaDireita
              linhas={itens.map((item) => [
                <span key="i">
                  <span className="font-medium">{TIPO_VENDA_LABEL[item.tipo]}</span>
                  {item.descricao && <span className="text-muted-foreground"> · {item.descricao}</span>}
                  {item.statusVenda === "cancelada" && (
                    <span className="text-destructive"> ({STATUS_VENDA_LABEL.cancelada})</span>
                  )}
                </span>,
                item.fornecedorNome || "—",
                item.numeroPedido,
                formatCurrency(item.valor),
              ])}
            />
            {resumo.vendas.some((v) => v.numeroPedidoExtras.length > 0) && (
              <p className="text-xs text-muted-foreground">
                Referências:{" "}
                {resumo.vendas
                  .flatMap((v) => v.numeroPedidoExtras)
                  .map((e) => (e.descricao ? `${e.descricao}: ${e.numero}` : e.numero))
                  .join(" · ")}
              </p>
            )}
          </>
        )}
      </Secao>

      <PagamentosSecao pagamentos={resumo.pagamentos} />

      <ContasSecao contas={resumo.contas} />

      {(resumo.comissoes.length > 0 || resumo.reembolsos.length > 0) && (
        <div className="grid gap-6 sm:grid-cols-2">
          {resumo.comissoes.length > 0 && (
            <Secao titulo="Comissão" icone={Banknote}>
              <ul className="space-y-1.5">
                {resumo.comissoes.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2">
                    <span>
                      {c.fornecedor || "Comissão"}{" "}
                      <span className="text-muted-foreground">· {STATUS_COMISSAO_LABEL[c.status]}</span>
                    </span>
                    <span className="font-medium">{formatCurrency(c.valor)}</span>
                  </li>
                ))}
              </ul>
            </Secao>
          )}
          {resumo.reembolsos.length > 0 && (
            <Secao titulo="Reembolsos" icone={Banknote}>
              <ul className="space-y-1.5">
                {resumo.reembolsos.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <span>
                      {r.motivo} <span className="text-muted-foreground">· {STATUS_REEMBOLSO_LABEL[r.status]}</span>
                    </span>
                    <span className="font-medium">{formatCurrency(r.valorAprovado ?? r.valorSolicitado)}</span>
                  </li>
                ))}
              </ul>
            </Secao>
          )}
        </div>
      )}

      {resumo.observacoes && (
        <Secao titulo="Observações">
          <p className="whitespace-pre-line text-muted-foreground">{resumo.observacoes}</p>
        </Secao>
      )}
    </div>
  );
}

export function PagamentosSecao({ pagamentos }: { pagamentos: Pagamento[] }) {
  return (
    <Secao titulo="Pagamentos" icone={Banknote}>
      {pagamentos.length === 0 ? (
        <Vazio>Nenhum pagamento registrado.</Vazio>
      ) : (
        <Tabela
          cabecalho={["Data", "Fornecedor", "Forma", "Origem", "Parcelas", "Valor"]}
          alinharUltimaDireita
          linhas={pagamentos.map((p) => [
            formatDate(p.dataPagamento),
            p.fornecedor,
            FORMA_PAGAMENTO_LABEL[p.formaPagamento],
            p.tipoCartao === "terceiro" && p.nomeTitularTerceiro
              ? `${origemPagamentoLabel(p.formaPagamento, p.tipoCartao)} (${p.nomeTitularTerceiro})`
              : origemPagamentoLabel(p.formaPagamento, p.tipoCartao),
            p.parcelas > 1 ? `${p.parcelas}x` : "À vista",
            formatCurrency(p.valor),
          ])}
        />
      )}
    </Secao>
  );
}

export function ContasSecao({ contas }: { contas: ContaFinanceira[] }) {
  return (
    <Secao titulo="Contas" icone={CalendarDays}>
      {contas.length === 0 ? (
        <Vazio>Nenhuma conta vinculada.</Vazio>
      ) : (
        <Tabela
          cabecalho={["Vencimento", "Descrição", "Tipo", "Status", "Valor"]}
          alinharUltimaDireita
          linhas={contas.map((c) => [
            formatDate(c.vencimento),
            <span key="d">
              {c.descricao}
              {c.observacoes && <span className="block text-xs text-muted-foreground">{c.observacoes}</span>}
            </span>,
            NATUREZA_CONTA_LABEL[c.natureza],
            <StatusBadge key="s" tone={STATUS_CONTA_TONE[c.status]} label={STATUS_CONTA_LABEL[c.status]} />,
            formatCurrency(c.valor),
          ])}
        />
      )}
    </Secao>
  );
}

export function Totais({ totais }: { totais: { totalVendido: number; pagoFornecedores: number; recebido: number; aReceber: number; comissao: number } }) {
  const itens = [
    { label: "Total vendido", valor: totais.totalVendido },
    { label: "Recebido do cliente", valor: totais.recebido },
    { label: "A receber", valor: totais.aReceber, destaque: totais.aReceber > 0 },
    { label: "Pago a fornecedores", valor: totais.pagoFornecedores },
    { label: "Comissão", valor: totais.comissao },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {itens.map((item) => (
        <div
          key={item.label}
          className={`rounded-lg border px-3 py-2 ${item.destaque ? "border-warning/50 bg-warning/10" : "border-border"}`}
        >
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="font-display font-semibold">{formatCurrency(item.valor)}</p>
        </div>
      ))}
    </div>
  );
}

export function Itinerario({ trechos }: { trechos: VooTrecho[] }) {
  const ida = trechos.filter((t) => t.sentido === "ida");
  const volta = trechos.filter((t) => t.sentido === "volta");
  if (trechos.length === 0) return <Vazio>Nenhum voo cadastrado.</Vazio>;
  return (
    <div className="space-y-4 text-sm">
      {ida.length > 0 && <GrupoTrechos titulo="Ida" icone={PlaneTakeoff} trechos={ida} />}
      {volta.length > 0 && <GrupoTrechos titulo="Volta" icone={PlaneLanding} trechos={volta} />}
    </div>
  );
}

function GrupoTrechos({
  titulo,
  icone: Icone,
  trechos,
}: {
  titulo: string;
  icone: React.ComponentType<{ className?: string }>;
  trechos: VooTrecho[];
}) {
  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icone className="h-4 w-4" />
        {titulo}
        {trechos.length > 1 && <span className="normal-case">· {trechos.length - 1} conexão(ões)</span>}
      </p>
      <ol className="space-y-2">
        {trechos.map((t, i) => (
          <li key={t.id ?? i} className="rounded-lg border border-border p-3 break-inside-avoid">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">
                {[t.numeroVoo, t.companhia].filter(Boolean).join(" · ") || "Voo"}
              </span>
              <span className="text-xs text-muted-foreground">
                {[t.classe, t.bagagem && `Bagagem: ${t.bagagem}`, t.aeronave].filter(Boolean).join(" · ")}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <Ponto iata={t.origemIata} aeroporto={t.origemAeroporto} horario={t.partidaPrevista} terminal={t.terminalPartida} />
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Ponto
                iata={t.destinoIata}
                aeroporto={t.destinoAeroporto}
                horario={t.chegadaPrevista}
                terminal={t.terminalChegada}
                direita
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Ponto({
  iata,
  aeroporto,
  horario,
  terminal,
  direita,
}: {
  iata?: string;
  aeroporto?: string;
  horario?: string;
  terminal?: string;
  direita?: boolean;
}) {
  return (
    <div className={direita ? "text-right" : undefined}>
      <p className="font-display text-lg font-semibold leading-tight">{iata || "—"}</p>
      {aeroporto && <p className="text-xs text-muted-foreground">{aeroporto}</p>}
      <p className="text-xs">{formatHorarioVoo(horario)}</p>
      {terminal && <p className="text-xs text-muted-foreground">Terminal {terminal}</p>}
    </div>
  );
}

export function Secao({
  titulo,
  icone: Icone,
  children,
}: {
  titulo: string;
  icone?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 break-inside-avoid">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        {Icone && <Icone className="h-4 w-4 text-muted-foreground" />}
        {titulo}
      </h3>
      {children}
    </section>
  );
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground">{children}</p>;
}

export function Tabela({
  cabecalho,
  linhas,
  alinharUltimaDireita,
}: {
  cabecalho: string[];
  linhas: React.ReactNode[][];
  alinharUltimaDireita?: boolean;
}) {
  const ultima = cabecalho.length - 1;
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 text-xs text-muted-foreground">
          <tr>
            {cabecalho.map((c, i) => (
              <th key={c} className={`px-3 py-2 font-medium ${alinharUltimaDireita && i === ultima ? "text-right" : ""}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, li) => (
            <tr key={li} className="border-t border-border">
              {linha.map((celula, ci) => (
                <td
                  key={ci}
                  className={`px-3 py-2 align-top ${alinharUltimaDireita && ci === ultima ? "whitespace-nowrap text-right font-medium" : ""}`}
                >
                  {celula}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
