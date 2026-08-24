"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge, type StatusTone } from "@/components/common/status-badge";
import { AttachmentsPanel } from "@/components/upload/attachments-panel";
import { PagamentosTab } from "@/components/pagamentos/pagamentos-tab";
import { ReembolsosTab } from "@/components/reembolsos/reembolsos-tab";
import { PassageirosTab } from "@/components/viagens/passageiros-tab";
import { ViagemForm } from "@/components/viagens/viagem-form";
import { VoucherTab } from "@/components/viagens/voucher-tab";
import { useAtualizarViagem, useRemoverViagem, useViagem } from "@/hooks/use-viagens";
import { STATUS_VIAGEM_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { StatusViagem } from "@/types/entities";

const STATUS_TONE: Record<StatusViagem, StatusTone> = {
  orcamento: "neutral",
  confirmada: "info",
  em_andamento: "warning",
  concluida: "success",
  cancelada: "danger",
};

export default function ViagemDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: viagem, isLoading } = useViagem(params.id);
  const atualizarViagem = useAtualizarViagem(params.id);
  const removerViagem = useRemoverViagem();

  if (isLoading || !viagem) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={viagem.destino}
        description={`${viagem.cliente?.nome ?? "Cliente"} · ${formatDate(viagem.dataIda)} – ${formatDate(viagem.dataVolta)}`}
        actions={
          <>
            <StatusBadge tone={STATUS_TONE[viagem.status]} label={STATUS_VIAGEM_LABEL[viagem.status]} />
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

      <Tabs defaultValue="passageiros">
        <TabsList>
          <TabsTrigger value="passageiros">Passageiros</TabsTrigger>
          <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          <TabsTrigger value="reembolsos">Reembolsos</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="voucher">Voucher</TabsTrigger>
        </TabsList>

        <TabsContent value="passageiros" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <PassageirosTab viagemId={viagem.id} passageiros={viagem.passageiros ?? []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamentos" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <PagamentosTab viagemId={viagem.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reembolsos" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <ReembolsosTab viagemId={viagem.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <AttachmentsPanel viagemId={viagem.id} title="" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voucher" className="pt-4">
          <VoucherTab viagemId={viagem.id} />
        </TabsContent>
      </Tabs>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Editar viagem</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <ViagemForm
              viagem={viagem}
              clienteFixo={viagem.cliente ? { id: viagem.cliente.id, nome: viagem.cliente.nome } : undefined}
              isSubmitting={atualizarViagem.isPending}
              onCancel={() => setEditOpen(false)}
              onSubmit={(values) =>
                atualizarViagem.mutate(values, { onSuccess: () => setEditOpen(false) })
              }
            />
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remover viagem"
        description="Esta ação não pode ser desfeita. Passageiros, pagamentos e reembolsos vinculados também serão removidos."
        confirmLabel="Remover"
        isLoading={removerViagem.isPending}
        onConfirm={() =>
          removerViagem.mutate(viagem.id, { onSuccess: () => router.push("/viagens") })
        }
      />
    </div>
  );
}
