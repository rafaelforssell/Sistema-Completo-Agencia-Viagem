"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { comissaoColumns } from "@/components/comissoes/comissao-columns";
import { ComissaoForm } from "@/components/comissoes/comissao-form";
import {
  useAtualizarComissao,
  useComissoes,
  useCriarComissao,
  useRemoverComissao,
} from "@/hooks/use-comissoes";
import { useDebounce } from "@/hooks/use-debounce";
import { STATUS_COMISSAO_OPTIONS } from "@/lib/constants";
import type { Comissao } from "@/types/entities";

const PAGE_SIZE = 10;

export default function ComissoesPage() {
  const [pageIndex, setPageIndex] = useState(0);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Comissao | null>(null);
  const [removendo, setRemovendo] = useState<Comissao | null>(null);
  const buscaDebounced = useDebounce(busca);

  const { data, isLoading, isPlaceholderData } = useComissoes({
    pagina: pageIndex + 1,
    porPagina: PAGE_SIZE,
    busca: buscaDebounced || undefined,
    status: status === "todos" ? undefined : status,
  });

  const criar = useCriarComissao();
  const atualizar = useAtualizarComissao();
  const remover = useRemoverComissao();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comissionamento"
        description="Comissões por viagem e fornecedor, com valor líquido calculado pelo servidor."
        actions={
          <Button onClick={() => { setEditando(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" />
            Nova comissão
          </Button>
        }
      />

      <DataTableToolbar
        searchValue={busca}
        onSearchChange={(value) => {
          setBusca(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Buscar por fornecedor..."
        filters={
          <Select value={status} onValueChange={(v) => { setStatus(v); setPageIndex(0); }}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {STATUS_COMISSAO_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <DataTable<Comissao, unknown>
        columns={comissaoColumns}
        data={data?.dados ?? []}
        isLoading={isLoading && !isPlaceholderData}
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        pageCount={data?.totalPaginas ?? 0}
        totalItems={data?.total ?? 0}
        onPageChange={setPageIndex}
        onRowClick={(comissao) => { setEditando(comissao); setFormOpen(true); }}
        emptyTitle="Nenhuma comissão cadastrada"
        emptyDescription="Cadastre comissões vinculadas a viagens e fornecedores."
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar comissão" : "Nova comissão"}</DialogTitle>
          </DialogHeader>
          <ComissaoForm
            comissao={editando ?? undefined}
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
              Remover comissão
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removendo)}
        onOpenChange={(open) => !open && setRemovendo(null)}
        title="Remover comissão"
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
