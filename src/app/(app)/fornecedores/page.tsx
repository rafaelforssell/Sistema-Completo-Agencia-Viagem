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
import { fornecedorColumns } from "@/components/fornecedores/fornecedor-columns";
import { FornecedorForm } from "@/components/fornecedores/fornecedor-form";
import {
  useAtualizarFornecedor,
  useCriarFornecedor,
  useFornecedores,
  useRemoverFornecedor,
} from "@/hooks/use-fornecedores";
import { useDebounce } from "@/hooks/use-debounce";
import { TIPO_FORNECEDOR_OPTIONS } from "@/lib/constants";
import type { Fornecedor } from "@/types/entities";

const PAGE_SIZE = 10;

export default function FornecedoresPage() {
  const [pageIndex, setPageIndex] = useState(0);
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [removendo, setRemovendo] = useState<Fornecedor | null>(null);
  const buscaDebounced = useDebounce(busca);

  const { data, isLoading, isPlaceholderData } = useFornecedores({
    pagina: pageIndex + 1,
    porPagina: PAGE_SIZE,
    busca: buscaDebounced || undefined,
    tipo: tipo === "todos" ? undefined : tipo,
  });

  const criar = useCriarFornecedor();
  const atualizar = useAtualizarFornecedor();
  const remover = useRemoverFornecedor();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fornecedores"
        description="Companhias aéreas, hotéis, operadoras e demais fornecedores da agência."
        actions={
          <Button onClick={() => { setEditando(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" />
            Novo fornecedor
          </Button>
        }
      />

      <DataTableToolbar
        searchValue={busca}
        onSearchChange={(value) => {
          setBusca(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Buscar por nome ou e-mail..."
        filters={
          <Select value={tipo} onValueChange={(v) => { setTipo(v); setPageIndex(0); }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {TIPO_FORNECEDOR_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <DataTable<Fornecedor, unknown>
        columns={fornecedorColumns}
        data={data?.dados ?? []}
        isLoading={isLoading && !isPlaceholderData}
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        pageCount={data?.totalPaginas ?? 0}
        totalItems={data?.total ?? 0}
        onPageChange={setPageIndex}
        onRowClick={(fornecedor) => { setEditando(fornecedor); setFormOpen(true); }}
        emptyTitle="Nenhum fornecedor cadastrado"
        emptyDescription="Cadastre companhias aéreas, hotéis e operadoras usados nas viagens."
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle>
          </DialogHeader>
          <FornecedorForm
            fornecedor={editando ?? undefined}
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
              Remover fornecedor
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removendo)}
        onOpenChange={(open) => !open && setRemovendo(null)}
        title="Remover fornecedor"
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
