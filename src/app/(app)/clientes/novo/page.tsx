"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { ClienteForm } from "@/components/clientes/cliente-form";
import { useCriarCliente } from "@/hooks/use-clientes";
import type { ClienteFormValues } from "@/lib/schemas/cliente";

export default function NovoClientePage() {
  const router = useRouter();
  const criarCliente = useCriarCliente();

  function handleSubmit(values: ClienteFormValues) {
    criarCliente.mutate(values, {
      onSuccess: (cliente) => router.push(`/clientes/${cliente.id}`),
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Novo cliente" description="Preencha os dados principais do cliente." />
      <Card>
        <CardContent className="pt-6">
          <ClienteForm
            onSubmit={handleSubmit}
            isSubmitting={criarCliente.isPending}
            onCancel={() => router.back()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
