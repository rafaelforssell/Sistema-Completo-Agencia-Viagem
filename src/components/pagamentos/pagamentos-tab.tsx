"use client";

import { useState } from "react";
import { CreditCard, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { PagamentoForm } from "@/components/pagamentos/pagamento-form";
import {
  useAtualizarPagamento,
  useCriarPagamento,
  usePagamentosPorViagem,
  useRemoverPagamento,
} from "@/hooks/use-pagamentos";
import { FORMA_PAGAMENTO_LABEL, origemPagamentoLabel } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Pagamento } from "@/types/entities";

export function PagamentosTab({ viagemId }: { viagemId: string }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Pagamento | null>(null);
  const [removendo, setRemovendo] = useState<Pagamento | null>(null);

  const { data: pagamentos, isLoading } = usePagamentosPorViagem(viagemId);
  const criar = useCriarPagamento(viagemId);
  const atualizar = useAtualizarPagamento(viagemId);
  const remover = useRemoverPagamento(viagemId);

  const total = (pagamentos ?? []).reduce((acc, p) => acc + p.valor, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total pago: <span className="font-medium text-foreground">{formatCurrency(total)}</span>
        </p>
        <Button size="sm" onClick={() => { setEditando(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" />
          Registrar pagamento
        </Button>
      </div>

      {!isLoading && (!pagamentos || pagamentos.length === 0) ? (
        <EmptyState icon={CreditCard} title="Nenhum pagamento registrado" description="Registre os pagamentos feitos para esta viagem." />
      ) : (
        <div className="space-y-1.5">
          {pagamentos?.map((pagamento) => (
            <div key={pagamento.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {pagamento.fornecedor} · {formatCurrency(pagamento.valor)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {FORMA_PAGAMENTO_LABEL[pagamento.formaPagamento]} · {pagamento.parcelas}x ·{" "}
                  {formatDate(pagamento.dataPagamento)}
                  {pagamento.companhiaAerea ? ` · ${pagamento.companhiaAerea}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge
                  tone={pagamento.tipoCartao === "agencia" ? "info" : pagamento.tipoCartao === "cliente" ? "success" : "warning"}
                  label={origemPagamentoLabel(pagamento.formaPagamento, pagamento.tipoCartao)}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditando(pagamento); setFormOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setRemovendo(pagamento)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar pagamento" : "Registrar pagamento"}</DialogTitle>
          </DialogHeader>
          <PagamentoForm
            pagamento={editando ?? undefined}
            isSubmitting={criar.isPending || atualizar.isPending}
            onCancel={() => setFormOpen(false)}
            onSubmit={(values) => {
              if (editando) {
                atualizar.mutate({ id: editando.id, input: values }, { onSuccess: () => setFormOpen(false) });
              } else {
                criar.mutate(values, { onSuccess: () => setFormOpen(false) });
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removendo)}
        onOpenChange={(open) => !open && setRemovendo(null)}
        title="Remover pagamento"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        isLoading={remover.isPending}
        onConfirm={() => {
          if (!removendo) return;
          remover.mutate(removendo.id, { onSuccess: () => setRemovendo(null) });
        }}
      />
    </div>
  );
}
