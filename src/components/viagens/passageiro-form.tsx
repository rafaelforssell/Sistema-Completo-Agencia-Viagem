"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PassageiroCampos } from "@/components/viagens/passageiro-campos";
import { passageiroSchema, type PassageiroFormValues } from "@/lib/schemas/viagem";
import type { Passageiro } from "@/types/entities";

interface PassageiroFormProps {
  passageiro?: Passageiro;
  onSubmit: (values: PassageiroFormValues) => void;
  isSubmitting?: boolean;
  onCancel: () => void;
}

export function PassageiroForm({ passageiro, onSubmit, isSubmitting, onCancel }: PassageiroFormProps) {
  const form = useForm<PassageiroFormValues>({
    resolver: zodResolver(passageiroSchema),
    defaultValues: {
      nome: passageiro?.nome ?? "",
      parentesco: passageiro?.parentesco ?? "",
      email: passageiro?.email ?? "",
      telefone: passageiro?.telefone ?? "",
      dataNascimento: passageiro?.dataNascimento?.slice(0, 10) ?? "",
      numeroPassaporte: passageiro?.numeroPassaporte ?? "",
      validadePassaporte: passageiro?.validadePassaporte?.slice(0, 10) ?? "",
      numeroBilhete: passageiro?.numeroBilhete ?? "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <PassageiroCampos form={form} autoFocus />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {passageiro ? "Salvar" : "Adicionar passageiro"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
