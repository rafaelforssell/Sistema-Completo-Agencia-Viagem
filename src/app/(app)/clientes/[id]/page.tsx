"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Cake,
  FileText,
  IdCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plane,
  Plus,
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
import { ViagemForm } from "@/components/viagens/viagem-form";
import { ViagemResumo } from "@/components/viagens/viagem-resumo";
import { useAtualizarCliente, useCliente, useRemoverCliente } from "@/hooks/use-clientes";
import { useCriarViagem } from "@/hooks/use-viagens";
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
  const [novaViagemOpen, setNovaViagemOpen] = useState(false);
  const [resumoViagemId, setResumoViagemId] = useState<string | null>(null);

  const { data: cliente, isLoading } = useCliente(params.id);
  const atualizarCliente = useAtualizarCliente(params.id);
  const removerCliente = useRemoverCliente();
  const criarViagem = useCriarViagem();

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
              <span className="text-foreground">
                {cliente.telefone ? `${cliente.telefoneDdi ?? ""} ${cliente.telefone}`.trim() : "Não informado"}
              </span>
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
            {(cliente.rg || cliente.cpf) && (
              <div className="flex items-start gap-2.5 text-muted-foreground">
                <IdCard className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-0.5 text-foreground">
                  {cliente.rg && <p>RG: {cliente.rg}</p>}
                  {cliente.cpf && <p>CPF: {cliente.cpf}</p>}
                </div>
              </div>
            )}
            {(cliente.logradouro || cliente.cidade) && (
              <div className="flex items-start gap-2.5 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="text-foreground">
                  <p>
                    {cliente.logradouro}
                    {cliente.numero ? `, ${cliente.numero}` : ""}
                    {cliente.complemento ? ` - ${cliente.complemento}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[cliente.bairro, cliente.cidade, cliente.estado].filter(Boolean).join(" - ")}
                    {cliente.cep ? ` · CEP ${cliente.cep}` : ""}
                  </p>
                </div>
              </div>
            )}
            {cliente.observacoes && (
              <p className="border-t border-border pt-3 text-muted-foreground">{cliente.observacoes}</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Viagens vinculadas</CardTitle>
              <Button size="sm" onClick={() => setNovaViagemOpen(true)}>
                <Plus className="h-4 w-4" />
                Nova viagem
              </Button>
            </CardHeader>
            <CardContent>
              {!cliente.viagens || cliente.viagens.length === 0 ? (
                <EmptyState
                  icon={Plane}
                  title="Nenhuma viagem cadastrada"
                  description="Clique em “Nova viagem” para cadastrar voos, passageiros e a venda."
                />
              ) : (
                <div className="space-y-1.5">
                  {cliente.viagens.map((viagem) => (
                    <div
                      key={viagem.id}
                      className="flex items-center gap-2 rounded-lg border border-border pr-2 text-sm hover:bg-muted/50"
                    >
                      <Link href={`/viagens/${viagem.id}`} className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{viagem.destino}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(viagem.dataIda)} – {formatDate(viagem.dataVolta)}
                          </p>
                        </div>
                        <StatusBadge
                          tone={STATUS_TONE[viagem.status]}
                          label={STATUS_VIAGEM_LABEL[viagem.status]}
                        />
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => setResumoViagemId(viagem.id)}>
                        <FileText className="h-4 w-4" />
                        Resumo
                      </Button>
                    </div>
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

      <Sheet open={novaViagemOpen} onOpenChange={setNovaViagemOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-5xl">
          <SheetHeader>
            <SheetTitle>Nova viagem para {cliente.nome}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {novaViagemOpen && (
              <ViagemForm
                clienteFixo={{ id: cliente.id, nome: cliente.nome }}
                isSubmitting={criarViagem.isPending}
                onCancel={() => setNovaViagemOpen(false)}
                onSubmit={(values) =>
                  criarViagem.mutate(values, {
                    onSuccess: (viagem) => {
                      setNovaViagemOpen(false);
                      setResumoViagemId(viagem.id);
                    },
                  })
                }
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(resumoViagemId)} onOpenChange={(open) => !open && setResumoViagemId(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-3xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Resumo da viagem</SheetTitle>
          </SheetHeader>
          <div className="mt-2">{resumoViagemId && <ViagemResumo viagemId={resumoViagemId} />}</div>
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
