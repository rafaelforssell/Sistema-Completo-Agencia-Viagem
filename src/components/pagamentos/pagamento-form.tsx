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
import { Textarea } from "@/components/ui/textarea";
import { FORMA_PAGAMENTO_OPTIONS, campoOrigemLabel, origemPagamentoOptions } from "@/lib/constants";
import { pagamentoSchema, type PagamentoFormValues } from "@/lib/schemas/pagamento";
import type { Pagamento } from "@/types/entities";

interface PagamentoFormProps {
  pagamento?: Pagamento;
  onSubmit: (values: PagamentoFormValues) => void;
  isSubmitting?: boolean;
  onCancel: () => void;
}

export function PagamentoForm({ pagamento, onSubmit, isSubmitting, onCancel }: PagamentoFormProps) {
  const form = useForm<PagamentoFormValues>({
    resolver: zodResolver(pagamentoSchema),
    defaultValues: {
      companhiaAerea: pagamento?.companhiaAerea ?? "",
      fornecedor: pagamento?.fornecedor ?? "",
      formaPagamento: pagamento?.formaPagamento ?? "cartao_credito",
      tipoCartao: pagamento?.tipoCartao ?? "agencia",
      nomeTitularTerceiro: pagamento?.nomeTitularTerceiro ?? "",
      valor: pagamento?.valor ?? 0,
      parcelas: pagamento?.parcelas ?? 1,
      dataPagamento: pagamento?.dataPagamento?.slice(0, 10) ?? "",
      observacoes: pagamento?.observacoes ?? "",
    },
  });

  const tipoCartao = form.watch("tipoCartao");
  const formaPagamento = form.watch("formaPagamento");
  const origemOptions = origemPagamentoOptions(formaPagamento);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fornecedor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do fornecedor" autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companhiaAerea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Companhia aérea</FormLabel>
                <FormControl>
                  <Input placeholder="TAP, LATAM..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="formaPagamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forma de pagamento</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FORMA_PAGAMENTO_OPTIONS.map((option) => (
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
            name="tipoCartao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{campoOrigemLabel(formaPagamento)}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {origemOptions.map((option) => (
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

          {tipoCartao === "terceiro" && (
            <FormField
              control={form.control}
              name="nomeTitularTerceiro"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nome do titular / responsável</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do titular" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <CurrencyInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="parcelas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parcelas</FormLabel>
                <FormControl>
                  <Input type="number" min="1" step="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dataPagamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data do pagamento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
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
            {pagamento ? "Salvar" : "Registrar pagamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
