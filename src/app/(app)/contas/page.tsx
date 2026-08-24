"use client";

import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Plus, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { contaColumns } from "@/components/contas/conta-columns";
import { ContaForm } from "@/components/contas/conta-form";
import {
  useAtualizarConta,
  useContas,
  useCriarConta,
  useRemoverConta,
  useResumoFinanceiro,
} from "@/hooks/use-contas";
import { useDebounce } from "@/hooks/use-debounce";
import { NATUREZA_CONTA_LABEL, STATUS_CONTA_OPTIONS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { ContaFinanceira } from "@/types/entities";

const PAGE_SIZE = 10;

export default function ContasPage() {
  const [pageIndex, setPageIndex] = useState(0);
  const [busca, setBusca] = useState("");
  const [natureza, setNatureza] = useState("todas");
  const [status, setStatus] = useState("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<ContaFinanceira | null>(null);
  const [removendo, setRemovendo] = useState<ContaFinanceira | null>(null);
  const buscaDebounced = useDebounce(busca);

  const { data: resumo } = useResumoFinanceiro();
  const { data, isLoading, isPlaceholderData } = useContas({
    pagina: pageIndex + 1,
    porPagina: PAGE_SIZE,
    busca: buscaDebounced || undefined,
    natureza: natureza === "todas" ? undefined : natureza,
    status: status === "todos" ? undefined : status,
  });

  const criar = useCriarConta();
  const atualizar = useAtualizarConta();
  const remover = useRemoverConta();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle de contas"
        description="Visão geral do financeiro: a pagar, a receber e saldo por fonte."
        actions={
          <Button onClick={() => { setEditando(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" />
            Nova conta
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="A receber de clientes"
          value={formatCurrency(resumo?.totalAReceber ?? 0)}
          icon={ArrowDownCircle}
          tone="success"
        />
        <StatCard
          label="A pagar a fornecedores"
          value={formatCurrency(resumo?.totalAPagar ?? 0)}
          icon={ArrowUpCircle}
          tone="warning"
        />
        <StatCard
          label="Contas atrasadas"
          value={formatCurrency(resumo?.totalAtrasado ?? 0)}
          icon={TriangleAlert}
          tone="danger"
        />
      </div>

      {resumo && resumo.saldoPorFonte.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saldo por cartão / fonte</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {resumo.saldoPorFonte.map((item) => (
              <div key={item.fonte} className="rounded-lg border border-border px-3 py-2.5">
                <p className="text-xs text-muted-foreground">{item.fonte}</p>
                <p className="font-display text-lg font-semibold">{formatCurrency(item.saldo)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <DataTableToolbar
        searchValue={busca}
        onSearchChange={(value) => {
          setBusca(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Buscar por descrição ou cliente/fornecedor..."
        filters={
          <>
            <Select value={natureza} onValueChange={(v) => { setNatureza(v); setPageIndex(0); }}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as naturezas</SelectItem>
                {Object.entries(NATUREZA_CONTA_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPageIndex(0); }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {STATUS_CONTA_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <DataTable<ContaFinanceira, unknown>
        columns={contaColumns}
        data={data?.dados ?? []}
        isLoading={isLoading && !isPlaceholderData}
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        pageCount={data?.totalPaginas ?? 0}
        totalItems={data?.total ?? 0}
        onPageChange={setPageIndex}
        onRowClick={(conta) => { setEditando(conta); setFormOpen(true); }}
        emptyTitle="Nenhuma conta cadastrada"
        emptyDescription="Cadastre contas a pagar ou a receber para acompanhar o financeiro."
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar conta" : "Nova conta"}</DialogTitle>
          </DialogHeader>
          <ContaForm
            conta={editando ?? undefined}
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
          {editando && (
            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => setRemovendo(editando)}
            >
              <Trash2 className="h-4 w-4" />
              Remover conta
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removendo)}
        onOpenChange={(open) => !open && setRemovendo(null)}
        title="Remover conta"
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
