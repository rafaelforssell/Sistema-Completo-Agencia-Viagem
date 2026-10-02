"use client";

import { useMemo } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FornecedorCombobox } from "@/components/fornecedores/fornecedor-combobox";
import { TIPO_VENDA_OPTIONS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { VendaItemFormValues } from "@/lib/schemas/venda";

// Parte do formulário que descreve o que foi vendido: itens (com fornecedor
// próprio cada) e números de referência extras. Usada tanto no formulário
// de Venda quanto no de Viagem (que já cria a venda junto). Quem usa passa
// o próprio `form` convertido para este formato — os dois formulários têm
// `itens` e `numeroPedidoExtras` na raiz.
export interface VendaItensShape {
  itens: VendaItemFormValues[];
  numeroPedidoExtras?: { numero: string; descricao?: string }[];
}

export function VendaItensFields({
  form,
  titulo = "O que o cliente fechou?",
}: {
  form: UseFormReturn<VendaItensShape>;
  titulo?: string;
}) {
  const itensArray = useFieldArray({ control: form.control, name: "itens" });

  const itensValues = form.watch("itens");
  const valorTotal = useMemo(
    () => (itensValues ?? []).reduce((soma, item) => soma + (Number(item?.valor) || 0), 0),
    [itensValues]
  );
  const tiposPresentes = new Set((itensValues ?? []).map((item) => item?.tipo));

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{titulo}</p>
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
                <div className="grid gap-3 sm:grid-cols-2">
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
  );
}

export function NumerosPedidoExtrasFields({ form }: { form: UseFormReturn<VendaItensShape> }) {
  const extrasArray = useFieldArray({ control: form.control, name: "numeroPedidoExtras" });

  return (
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
        <p className="text-xs text-muted-foreground">Ex.: localizador da cia aérea, confirmação do hotel.</p>
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
  );
}
