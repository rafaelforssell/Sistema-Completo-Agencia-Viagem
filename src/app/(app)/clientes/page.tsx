"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { clienteColumns } from "@/components/clientes/cliente-columns";
import { useClientes } from "@/hooks/use-clientes";
import { useDebounce } from "@/hooks/use-debounce";
import type { Cliente } from "@/types/entities";

const PAGE_SIZE = 10;

export default function ClientesPage() {
  const router = useRouter();
  const [pageIndex, setPageIndex] = useState(0);
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounce(busca);

  const { data, isLoading, isPlaceholderData } = useClientes({
    pagina: pageIndex + 1,
    porPagina: PAGE_SIZE,
    busca: buscaDebounced || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Cadastro central de clientes da agência."
        actions={
          <Button asChild>
            <Link href="/clientes/novo">
              <Plus className="h-4 w-4" />
              Novo cliente
            </Link>
          </Button>
        }
      />

      <DataTableToolbar
        searchValue={busca}
        onSearchChange={(value) => {
          setBusca(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Buscar por nome, e-mail ou telefone..."
      />

      <DataTable<Cliente, unknown>
        columns={clienteColumns}
        data={data?.dados ?? []}
        isLoading={isLoading && !isPlaceholderData}
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        pageCount={data?.totalPaginas ?? 0}
        totalItems={data?.total ?? 0}
        onPageChange={setPageIndex}
        onRowClick={(cliente) => router.push(`/clientes/${cliente.id}`)}
        emptyTitle="Nenhum cliente cadastrado"
        emptyDescription="Cadastre o primeiro cliente para começar a organizar viagens e documentos."
      />
    </div>
  );
}
