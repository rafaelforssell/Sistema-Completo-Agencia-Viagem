"use client";

import { useState } from "react";
import { Pencil, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge, type StatusTone } from "@/components/common/status-badge";
import { VendaForm } from "@/components/vendas/venda-form";
import { useAtualizarVenda, useCriarVenda } from "@/hooks/use-vendas";
import { STATUS_VENDA_LABEL, TIPO_VENDA_LABEL } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { StatusVenda, Venda, Viagem } from "@/types/entities";

const STATUS_TONE: Record<StatusVenda, StatusTone> = {
  orcamento: "neutral",
  confirmada: "success",
  cancelada: "danger",
};

// Venda(s) vinculada(s) à viagem. A primeira é criada junto com a viagem;
// aqui dá pra completar itens, fornecedores e números de pedido.
export function VendaTab({ viagem }: { viagem: Viagem }) {
  const [editando, setEditando] = useState<Venda | null>(null);
  const [criando, setCriando] = useState(false);
  const atualizar = useAtualizarVenda();
  const criar = useCriarVenda();
  const vendas = viagem.vendas ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setCriando(true)}>
          <Plus className="h-4 w-4" />
          Nova venda para esta viagem
        </Button>
      </div>

      {vendas.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="Nenhuma venda vinculada" description="Crie a venda desta viagem." />
      ) : (
        vendas.map((venda) => (
          <div key={venda.id} className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">Pedido {venda.numeroPedido}</p>
                <p className="text-xs text-muted-foreground">Vendida em {formatDate(venda.dataVenda)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone={STATUS_TONE[venda.status]} label={STATUS_VENDA_LABEL[venda.status]} />
                <Button variant="outline" size="sm" onClick={() => setEditando(venda)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              </div>
            </div>
            <ul className="divide-y divide-border text-sm">
              {venda.itens.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 py-2">
                  <span>
                    <span className="font-medium">{TIPO_VENDA_LABEL[item.tipo]}</span>
                    {item.descricao && <span className="text-muted-foreground"> · {item.descricao}</span>}
                  </span>
                  <span>{formatCurrency(item.valor)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
              <span>Total</span>
              <span>{formatCurrency(venda.valorTotal)}</span>
            </div>
          </div>
        ))
      )}

      <Dialog
        open={Boolean(editando) || criando}
        onOpenChange={(open) => {
          if (!open) {
            setEditando(null);
            setCriando(false);
          }
        }}
      >
        <DialogContent className="overflow-y-auto sm:max-h-[85vh] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar venda" : "Nova venda"}</DialogTitle>
          </DialogHeader>
          <VendaForm
            key={editando?.id ?? "nova"}
            venda={editando ?? undefined}
            padrao={{ clienteId: viagem.clienteId, viagemId: viagem.id }}
            isSubmitting={atualizar.isPending || criar.isPending}
            onCancel={() => {
              setEditando(null);
              setCriando(false);
            }}
            onSubmit={(values) => {
              const fechar = {
                onSuccess: () => {
                  setEditando(null);
                  setCriando(false);
                },
              };
              if (editando) atualizar.mutate({ id: editando.id, input: values }, fechar);
              else criar.mutate(values, fechar);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
