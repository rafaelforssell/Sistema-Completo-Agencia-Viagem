"use client";

import { useState } from "react";
import { Pencil, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge, type StatusTone } from "@/components/common/status-badge";
import { ReembolsoForm } from "@/components/reembolsos/reembolso-form";
import { usePagamentosPorViagem } from "@/hooks/use-pagamentos";
import {
  useAtualizarReembolso,
  useCriarReembolso,
  useReembolsosPorViagem,
  useRemoverReembolso,
} from "@/hooks/use-reembolsos";
import { STATUS_REEMBOLSO_LABEL } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Reembolso, StatusReembolso } from "@/types/entities";

const STATUS_TONE: Record<StatusReembolso, StatusTone> = {
  solicitado: "neutral",
  em_analise: "warning",
  aprovado: "info",
  pago: "success",
  negado: "danger",
};

export function ReembolsosTab({ viagemId }: { viagemId: string }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Reembolso | null>(null);
  const [removendo, setRemovendo] = useState<Reembolso | null>(null);

  const { data: reembolsos, isLoading } = useReembolsosPorViagem(viagemId);
  const { data: pagamentos } = usePagamentosPorViagem(viagemId);
  const criar = useCriarReembolso(viagemId);
  const atualizar = useAtualizarReembolso();
  const remover = useRemoverReembolso();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditando(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" />
          Registrar reembolso
        </Button>
      </div>

      {!isLoading && (!reembolsos || reembolsos.length === 0) ? (
        <EmptyState icon={RefreshCcw} title="Nenhum reembolso registrado" description="Registre solicitações de reembolso desta viagem." />
      ) : (
        <div className="space-y-1.5">
          {reembolsos?.map((reembolso) => (
            <div key={reembolso.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{reembolso.motivo}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Solicitado: {formatCurrency(reembolso.valorSolicitado)} · {formatDate(reembolso.dataSolicitacao)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge tone={STATUS_TONE[reembolso.status]} label={STATUS_REEMBOLSO_LABEL[reembolso.status]} />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditando(reembolso); setFormOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setRemovendo(reembolso)}
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
            <DialogTitle>{editando ? "Editar reembolso" : "Registrar reembolso"}</DialogTitle>
          </DialogHeader>
          <ReembolsoForm
            reembolso={editando ?? undefined}
            pagamentos={pagamentos ?? []}
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
        title="Remover reembolso"
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
