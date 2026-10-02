"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ClienteCombobox } from "@/components/clientes/cliente-combobox";
import { ViagemCombobox } from "@/components/viagens/viagem-combobox";
import {
  NumerosPedidoExtrasFields,
  VendaItensFields,
  type VendaItensShape,
} from "@/components/vendas/venda-itens-fields";
import { STATUS_VENDA_OPTIONS } from "@/lib/constants";
import { vendaSchema, type VendaFormValues } from "@/lib/schemas/venda";
import type { Venda } from "@/types/entities";

interface VendaFormProps {
  venda?: Venda;
  // Valores iniciais de uma venda nova (ex.: criada a partir da viagem).
  padrao?: { clienteId?: string; viagemId?: string };
  onSubmit: (values: VendaFormValues) => void;
  isSubmitting?: boolean;
  onCancel: () => void;
}

export function VendaForm({ venda, padrao, onSubmit, isSubmitting, onCancel }: VendaFormProps) {
  const form = useForm<VendaFormValues>({
    resolver: zodResolver(vendaSchema),
    defaultValues: {
      clienteId: venda?.clienteId ?? padrao?.clienteId ?? "",
      viagemId: venda?.viagemId ?? padrao?.viagemId ?? "",
      status: venda?.status ?? "orcamento",
      dataVenda: venda?.dataVenda?.slice(0, 10) ?? "",
      observacoes: venda?.observacoes ?? "",
      numeroPedidoExtras: venda?.numeroPedidoExtras?.map((extra) => ({
        numero: extra.numero,
        descricao: extra.descricao ?? "",
      })) ?? [],
      itens: venda?.itens?.map((item) => ({
        tipo: item.tipo,
        fornecedorId: item.fornecedorId ?? "",
        descricao: item.descricao ?? "",
        valor: item.valor,
        dataAluguel: item.dataAluguel?.slice(0, 10) ?? "",
        seguroCompleto: item.seguroCompleto ?? false,
      })) ?? [],
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {venda && (
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Número do pedido: </span>
            <span className="font-medium">{venda.numeroPedido}</span>
          </div>
        )}

        <FormField
          control={form.control}
          name="clienteId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <FormControl>
                <ClienteCombobox value={field.value} onChange={(id) => field.onChange(id)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="viagemId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Viagem vinculada (opcional)</FormLabel>
              <FormControl>
                <ViagemCombobox value={field.value} onChange={(id) => field.onChange(id)} />
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
                    {STATUS_VENDA_OPTIONS.map((option) => (
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
            name="dataVenda"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da venda</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <VendaItensFields form={form as unknown as UseFormReturn<VendaItensShape>} />
        <NumerosPedidoExtrasFields form={form as unknown as UseFormReturn<VendaItensShape>} />

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {venda ? "Salvar" : "Cadastrar venda"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
