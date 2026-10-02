"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ClienteCampos } from "@/components/clientes/cliente-campos";
import { clienteSchema, type ClienteFormValues } from "@/lib/schemas/cliente";
import type { Cliente } from "@/types/entities";

interface ClienteFormProps {
  cliente?: Cliente;
  onSubmit: (values: ClienteFormValues) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
  // Layout horizontal, para a página inteira de Novo cliente.
  largo?: boolean;
}

export function ClienteForm({ cliente, onSubmit, isSubmitting, onCancel, largo }: ClienteFormProps) {
  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: cliente?.nome ?? "",
      email: cliente?.email ?? "",
      telefone: cliente?.telefone ?? "",
      telefoneDdi: cliente?.telefoneDdi ?? "+55",
      dataNascimento: cliente?.dataNascimento?.slice(0, 10) ?? "",
      numeroPassaporte: cliente?.numeroPassaporte ?? "",
      validadePassaporte: cliente?.validadePassaporte?.slice(0, 10) ?? "",
      rg: cliente?.rg ?? "",
      cpf: cliente?.cpf ?? "",
      cep: cliente?.cep ?? "",
      logradouro: cliente?.logradouro ?? "",
      numero: cliente?.numero ?? "",
      complemento: cliente?.complemento ?? "",
      bairro: cliente?.bairro ?? "",
      cidade: cliente?.cidade ?? "",
      estado: cliente?.estado ?? "",
      observacoes: cliente?.observacoes ?? "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <ClienteCampos form={form} largo={largo} autoFocus />

        <div className="flex justify-end gap-2 pt-1">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {cliente ? "Salvar alterações" : "Cadastrar cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
