"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Cake,
  Mail,
  Pencil,
  Phone,
  Plane,
  Stamp,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { AttachmentsPanel } from "@/components/upload/attachments-panel";
import { ClienteForm } from "@/components/clientes/cliente-form";
import { useAtualizarCliente, useCliente, useRemoverCliente } from "@/hooks/use-clientes";
import { STATUS_VIAGEM_LABEL } from "@/lib/constants";
import { daysUntil, formatDate } from "@/lib/format";
import type { StatusViagem } from "@/types/entities";

const STATUS_TONE: Record<StatusViagem, "neutral" | "info" | "success" | "warning" | "danger"> = {
  orcamento: "neutral",
  confirmada: "info",
  em_andamento: "warning",
  concluida: "success",
  cancelada: "danger",
};

export default function ClienteDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: cliente, isLoading } = useCliente(params.id);
  const atualizarCliente = useAtualizarCliente(params.id);
  const removerCliente = useRemoverCliente();

  if (isLoading || !cliente) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const diasPassaporte = daysUntil(cliente.validadePassaporte);

  return (
    <div className="space-y-6">
      <PageHeader
        title={cliente.nome}
        description="Detalhes do cliente, viagens vinculadas e documentos."
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Remover
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Dados do cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate text-foreground">{cliente.email || "Não informado"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span className="text-foreground">{cliente.telefone || "Não informado"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Cake className="h-4 w-4 shrink-0" />
              <span className="text-foreground">{formatDate(cliente.dataNascimento)}</span>
            </div>
            <div className="flex items-start gap-2.5 text-muted-foreground">
              <Stamp className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1 text-foreground">
                <p>{cliente.numeroPassaporte || "Passaporte não informado"}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Validade: {formatDate(cliente.validadePassaporte)}</span>
                  {diasPassaporte !== null && diasPassaporte <= 180 && (
                    <StatusBadge
                      tone={diasPassaporte < 0 ? "danger" : diasPassaporte <= 30 ? "danger" : "warning"}
                      label={diasPassaporte < 0 ? "Vencido" : `Vence em ${diasPassaporte}d`}
                    />
                  )}
                </div>
              </div>
            </div>
            {cliente.observacoes && (
              <p className="border-t border-border pt-3 text-muted-foreground">{cliente.observacoes}</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Viagens vinculadas</CardTitle>
            </CardHeader>
            <CardContent>
              {!cliente.viagens || cliente.viagens.length === 0 ? (
                <EmptyState
                  icon={Plane}
                  title="Nenhuma viagem cadastrada"
                  description="As viagens deste cliente aparecerão aqui."
                />
              ) : (
                <div className="space-y-1.5">
                  {cliente.viagens.map((viagem) => (
                    <Link
                      key={viagem.id}
                      href={`/viagens/${viagem.id}`}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{viagem.destino}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(viagem.dataIda)} – {formatDate(viagem.dataVolta)}
                        </p>
                      </div>
                      <StatusBadge
                        tone={STATUS_TONE[viagem.status]}
                        label={STATUS_VIAGEM_LABEL[viagem.status]}
                      />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <AttachmentsPanel clienteId={cliente.id} title="" />
            </CardContent>
          </Card>
        </div>
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Editar cliente</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ClienteForm
              cliente={cliente}
              isSubmitting={atualizarCliente.isPending}
              onCancel={() => setEditOpen(false)}
              onSubmit={(values) =>
                atualizarCliente.mutate(values, { onSuccess: () => setEditOpen(false) })
              }
            />
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remover cliente"
        description="Esta ação não pode ser desfeita. Os dados do cliente serão removidos permanentemente."
        confirmLabel="Remover"
        isLoading={removerCliente.isPending}
        onConfirm={() =>
          removerCliente.mutate(cliente.id, { onSuccess: () => router.push("/clientes") })
        }
      />
    </div>
  );
}
