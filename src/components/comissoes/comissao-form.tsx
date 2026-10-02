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
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ViagemCombobox } from "@/components/viagens/viagem-combobox";
import { STATUS_COMISSAO_OPTIONS } from "@/lib/constants";
import { comissaoSchema, type ComissaoFormValues } from "@/lib/schemas/comissao";
import type { Comissao } from "@/types/entities";

interface ComissaoFormProps {
  comissao?: Comissao;
  onSubmit: (values: ComissaoFormValues) => void;
  isSubmitting?: boolean;
  onCancel: () => void;
}

export function ComissaoForm({ comissao, onSubmit, isSubmitting, onCancel }: ComissaoFormProps) {
  const form = useForm<ComissaoFormValues>({
    resolver: zodResolver(comissaoSchema),
    defaultValues: {
      viagemId: comissao?.viagemId ?? "",
      fornecedor: comissao?.fornecedor ?? "",
      valor: comissao?.valor ?? 0,
      status: comissao?.status ?? "pendente",
      dataPrevista: comissao?.dataPrevista?.slice(0, 10) ?? "",
      dataRecebimento: comissao?.dataRecebimento?.slice(0, 10) ?? "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="viagemId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Viagem</FormLabel>
              <FormControl>
                <ViagemCombobox value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fornecedor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="Companhia aérea, operadora..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor da comissão</FormLabel>
              <FormControl>
                <CurrencyInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUS_COMISSAO_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dataPrevista"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Previsão de recebimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
            {comissao ? "Salvar" : "Cadastrar comissão"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
