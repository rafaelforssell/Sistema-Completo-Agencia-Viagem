"use client";

import { useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { LeadForm } from "@/components/crm/lead-form";
import {
  useAtualizarEtapaLead,
  useAtualizarLead,
  useCriarLead,
  useLeads,
  useRemoverLead,
} from "@/hooks/use-leads";
import { ETAPA_LEAD_OPTIONS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LeadFormValues } from "@/lib/schemas/crm";
import type { EtapaLead, Lead } from "@/types/entities";

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
          : undefined
      }
      className={cn(
        "cursor-grab rounded-lg border border-border bg-card p-3 text-sm shadow-sm hover:border-primary/50",
        isDragging && "opacity-60"
      )}
    >
      <p className="font-medium">{lead.nome}</p>
      {lead.origem && <p className="text-xs text-muted-foreground">{lead.origem}</p>}
      {lead.valorEstimado !== undefined && lead.valorEstimado > 0 && (
        <p className="mt-1 text-xs font-medium text-primary">{formatCurrency(lead.valorEstimado)}</p>
      )}
    </div>
  );
}

function KanbanColumn({
  etapa,
  label,
  leads,
  onCardClick,
}: {
  etapa: EtapaLead;
  label: string;
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3",
        isOver && "border-primary bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-medium">{label}</p>
        <span className="text-xs text-muted-foreground">{leads.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onClick={() => onCardClick(lead)} />
        ))}
      </div>
    </div>
  );
}

export function LeadKanban() {
  const { data, isLoading } = useLeads({ porPagina: 200 });
  const atualizarEtapa = useAtualizarEtapaLead();
  const criar = useCriarLead();
  const atualizar = useAtualizarLead();
  const remover = useRemoverLead();

  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Lead | null>(null);
  const [removendo, setRemovendo] = useState<Lead | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const leads = data?.dados ?? [];

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const novaEtapa = over.id as EtapaLead;
    const lead = leads.find((l) => l.id === active.id);
    if (!lead || lead.etapa === novaEtapa) return;
    atualizarEtapa.mutate({ id: lead.id, etapa: novaEtapa });
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando funil...</p>;
  }

  if (leads.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => { setEditando(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" />
            Novo lead
          </Button>
        </div>
        <EmptyState icon={Users} title="Nenhum lead ainda" description="Cadastre o primeiro lead do funil de vendas." />
        <LeadFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          lead={editando}
          isSubmitting={criar.isPending || atualizar.isPending}
          onSubmit={(values) => {
            if (editando) {
              atualizar.mutate({ id: editando.id, input: values }, { onSuccess: () => setFormOpen(false) });
            } else {
              criar.mutate(values, { onSuccess: () => setFormOpen(false) });
            }
          }}
          onDelete={() => setRemovendo(editando)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => { setEditando(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" />
          Novo lead
        </Button>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {ETAPA_LEAD_OPTIONS.map((option) => (
            <KanbanColumn
              key={option.value}
              etapa={option.value}
              label={option.label}
              leads={leads.filter((lead) => lead.etapa === option.value)}
              onCardClick={(lead) => { setEditando(lead); setFormOpen(true); }}
            />
          ))}
        </div>
      </DndContext>

      <LeadFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        lead={editando}
        isSubmitting={criar.isPending || atualizar.isPending}
        onSubmit={(values) => {
          if (editando) {
            atualizar.mutate({ id: editando.id, input: values }, { onSuccess: () => setFormOpen(false) });
          } else {
            criar.mutate(values, { onSuccess: () => setFormOpen(false) });
          }
        }}
        onDelete={() => setRemovendo(editando)}
      />

      <ConfirmDialog
        open={Boolean(removendo)}
        onOpenChange={(open) => !open && setRemovendo(null)}
        title="Remover lead"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        isLoading={remover.isPending}
        onConfirm={() => {
          if (!removendo) return;
          remover.mutate(removendo.id, {
            onSuccess: () => {
              setRemovendo(null);
              setFormOpen(false);
            },
          });
        }}
      />
    </div>
  );
}

function LeadFormDialog({
  open,
  onOpenChange,
  lead,
  isSubmitting,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  isSubmitting: boolean;
  onSubmit: (values: LeadFormValues) => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto sm:max-h-[85vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
        </DialogHeader>
        <LeadForm
          lead={lead ?? undefined}
          isSubmitting={isSubmitting}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
        {lead && (
          <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Remover lead
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
