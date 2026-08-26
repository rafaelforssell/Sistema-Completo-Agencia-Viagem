"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Nome completo</FormLabel>
                <FormControl>
                  <Input placeholder="João da Silva" autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="parentesco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parentesco</FormLabel>
                <FormControl>
                  <Input placeholder="Cônjuge, filho(a)..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="maria@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dataNascimento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de nascimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numeroPassaporte"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número do passaporte</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="validadePassaporte"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Validade do passaporte</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="numeroBilhete"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Número do bilhete aéreo</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
