"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import { FornecedorCombobox } from "@/components/fornecedores/fornecedor-combobox";
import { ViagemCombobox } from "@/components/viagens/viagem-combobox";
import { STATUS_VENDA_OPTIONS, TIPO_VENDA_OPTIONS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { vendaSchema, type VendaFormValues } from "@/lib/schemas/venda";
import { cn } from "@/lib/utils";
import type { Venda } from "@/types/entities";

interface VendaFormProps {
  venda?: Venda;
  onSubmit: (values: VendaFormValues) => void;
  isSubmitting?: boolean;
  onCancel: () => void;
}

export function VendaForm({ venda, onSubmit, isSubmitting, onCancel }: VendaFormProps) {
  const form = useForm<VendaFormValues>({
    resolver: zodResolver(vendaSchema),
    defaultValues: {
      clienteId: venda?.clienteId ?? "",
      viagemId: venda?.viagemId ?? "",
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

  const itensArray = useFieldArray({ control: form.control, name: "itens" });
  const extrasArray = useFieldArray({ control: form.control, name: "numeroPedidoExtras" });

  const itensValues = form.watch("itens");
  const valorTotal = useMemo(
    () => (itensValues ?? []).reduce((soma, item) => soma + (Number(item?.valor) || 0), 0),
    [itensValues]
  );
  const tiposPresentes = new Set((itensValues ?? []).map((item) => item?.tipo));

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

        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">O que o cliente fechou?</p>
            <p className="font-display text-lg font-semibold">{formatCurrency(valorTotal)}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {TIPO_VENDA_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={tiposPresentes.has(option.value) ? "default" : "outline"}
                onClick={() =>
                  itensArray.append({
                    tipo: option.value,
                    fornecedorId: "",
                    descricao: "",
                    valor: 0,
                    dataAluguel: "",
                    seguroCompleto: false,
                  })
                }
              >
                {option.label}
              </Button>
            ))}
          </div>

          {form.formState.errors.itens?.message && (
            <p className="text-sm text-destructive">{form.formState.errors.itens.message}</p>
          )}

          <div className="space-y-3">
            {itensArray.fields.map((item, index) => {
              const tipoItem = form.watch(`itens.${index}.tipo`);
              return (
                <div key={item.id} className="space-y-3 rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">
                      {TIPO_VENDA_OPTIONS.find((o) => o.value === tipoItem)?.label}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => itensArray.remove(index)}
                      aria-label="Remover item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`itens.${index}.fornecedorId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Fornecedor</FormLabel>
                          <FormControl>
                            <FornecedorCombobox value={field.value} onChange={(id) => field.onChange(id)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`itens.${index}.valor`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Valor</FormLabel>
                          <FormControl>
                            <CurrencyInput {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`itens.${index}.descricao`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Descrição</FormLabel>
                        <FormControl>
                          <Input placeholder="Detalhes desse item..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {tipoItem === "aluguel_carro" && (
                    <div className={cn("grid gap-3 sm:grid-cols-2")}>
                      <FormField
                        control={form.control}
                        name={`itens.${index}.dataAluguel`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Data do aluguel</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`itens.${index}.seguroCompleto`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2 pt-5">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="text-xs font-normal">Seguro completo</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Números de referência extras</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => extrasArray.append({ numero: "", descricao: "" })}
            >
              <Plus className="h-4 w-4" />
              Adicionar número
            </Button>
          </div>
          {extrasArray.fields.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Ex.: localizador da cia aérea, confirmação do hotel.
            </p>
          ) : (
            extrasArray.fields.map((item, index) => (
              <div key={item.id} className="flex items-end gap-2">
                <FormField
                  control={form.control}
                  name={`numeroPedidoExtras.${index}.numero`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Número</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: ABC123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`numeroPedidoExtras.${index}.descricao`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Localizador da cia aérea" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mb-0.5 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => extrasArray.remove(index)}
                  aria-label="Remover número"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

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
