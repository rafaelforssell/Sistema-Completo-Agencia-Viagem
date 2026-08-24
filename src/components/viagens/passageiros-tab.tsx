"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { PassageiroForm } from "@/components/viagens/passageiro-form";
import {
  useAtualizarPassageiro,
  useCriarPassageiro,
  useRemoverPassageiro,
} from "@/hooks/use-viagens";
import { daysUntil, formatDate } from "@/lib/format";
import type { Passageiro } from "@/types/entities";

export function PassageirosTab({ viagemId, passageiros }: { viagemId: string; passageiros: Passageiro[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Passageiro | null>(null);
  const [removendo, setRemovendo] = useState<Passageiro | null>(null);

  const criar = useCriarPassageiro(viagemId);
  const atualizar = useAtualizarPassageiro(viagemId);
  const remover = useRemoverPassageiro(viagemId);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditando(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" />
          Adicionar passageiro
        </Button>
      </div>

      {passageiros.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title="Nenhum passageiro adicionado"
          description="Adicione os membros da família ou acompanhantes desta viagem."
        />
      ) : (
        <div className="space-y-1.5">
          {passageiros.map((passageiro) => {
            const dias = daysUntil(passageiro.validadePassaporte);
            return (
              <div
                key={passageiro.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{passageiro.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {passageiro.parentesco || "Passageiro"} · Nasc. {formatDate(passageiro.dataNascimento)}
                    {passageiro.numeroPassaporte ? ` · Passaporte ${passageiro.numeroPassaporte}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {dias !== null && dias <= 180 && (
                    <StatusBadge
                      tone={dias < 0 ? "danger" : dias <= 30 ? "danger" : "warning"}
                      label={dias < 0 ? "Passaporte vencido" : `Passaporte ${dias}d`}
                    />
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditando(passageiro); setFormOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setRemovendo(passageiro)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar passageiro" : "Adicionar passageiro"}</DialogTitle>
          </DialogHeader>
          <PassageiroForm
            passageiro={editando ?? undefined}
            isSubmitting={criar.isPending || atualizar.isPending}
            onCancel={() => setFormOpen(false)}
            onSubmit={(values) => {
              if (editando) {
                atualizar.mutate(
                  { passageiroId: editando.id, input: values },
                  { onSuccess: () => setFormOpen(false) }
                );
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
        title="Remover passageiro"
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
