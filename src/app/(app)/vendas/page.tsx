"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { vendaColumns } from "@/components/vendas/venda-columns";
import { VendaForm } from "@/components/vendas/venda-form";
import { VendaResumo } from "@/components/vendas/venda-resumo";
import {
  useAtualizarVenda,
  useCriarVenda,
  useRemoverVenda,
  useVendas,
} from "@/hooks/use-vendas";
import { useDebounce } from "@/hooks/use-debounce";
import { TIPO_VENDA_OPTIONS } from "@/lib/constants";
import type { Venda } from "@/types/entities";

const PAGE_SIZE = 10;

export default function VendasPage() {
  const [pageIndex, setPageIndex] = useState(0);
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<Venda | null>(null);
  const [removendo, setRemovendo] = useState<Venda | null>(null);
  const [visualizando, setVisualizando] = useState<Venda | null>(null);
  const buscaDebounced = useDebounce(busca);

  const { data, isLoading, isPlaceholderData } = useVendas({
    pagina: pageIndex + 1,
    porPagina: PAGE_SIZE,
    busca: buscaDebounced || undefined,
    tipo: tipo === "todos" ? undefined : tipo,
  });

  const criar = useCriarVenda();
  const atualizar = useAtualizarVenda();
  const remover = useRemoverVenda();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendas"
        description="Viagens, passeios, aluguel de carro e demais vendas da agência."
        actions={
          <Button onClick={() => { setEditando(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" />
            Nova venda
          </Button>
        }
      />

      <DataTableToolbar
        searchValue={busca}
        onSearchChange={(value) => {
          setBusca(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Buscar por descrição ou nº do pedido..."
        filters={
          <Select value={tipo} onValueChange={(v) => { setTipo(v); setPageIndex(0); }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {TIPO_VENDA_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <DataTable<Venda, unknown>
        columns={vendaColumns}
        data={data?.dados ?? []}
        isLoading={isLoading && !isPlaceholderData}
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        pageCount={data?.totalPaginas ?? 0}
        totalItems={data?.total ?? 0}
        onPageChange={setPageIndex}
        onRowClick={setVisualizando}
        emptyTitle="Nenhuma venda cadastrada"
        emptyDescription="Cadastre viagens, passeios, aluguel de carro e outras vendas da agência."
      />

      <Sheet open={Boolean(visualizando)} onOpenChange={(open) => !open && setVisualizando(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-3xl">
          <SheetHeader className="sr-only">
            <SheetTitle>Resumo da venda</SheetTitle>
          </SheetHeader>
          {visualizando && (
            <div className="mt-2 space-y-6">
              <VendaResumo vendaId={visualizando.id} />
              <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setRemovendo(visualizando)}
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
                <Button
                  onClick={() => {
                    setEditando(visualizando);
                    setVisualizando(null);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Editar venda
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="overflow-y-auto sm:max-h-[85vh] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar venda" : "Nova venda"}</DialogTitle>
          </DialogHeader>
          <VendaForm
            venda={editando ?? undefined}
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
              Remover venda
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removendo)}
        onOpenChange={(open) => !open && setRemovendo(null)}
        title="Remover venda"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        isLoading={remover.isPending}
        onConfirm={() => {
          if (!removendo) return;
          remover.mutate(removendo.id, {
            onSuccess: () => {
              setRemovendo(null);
              setFormOpen(false);
              setVisualizando(null);
            },
          });
        }}
      />
    </div>
  );
}
