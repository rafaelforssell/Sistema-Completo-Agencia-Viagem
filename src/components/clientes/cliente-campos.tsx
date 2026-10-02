"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UseFormReturn } from "react-hook-form";
import { DdiSelect } from "@/components/common/ddi-select";
import { CepInput } from "@/components/ui/cep-input";
import { CpfInput } from "@/components/ui/cpf-input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RgInput } from "@/components/ui/rg-input";
import { formatTelefone, TelefoneInput } from "@/components/ui/telefone-input";
import { Textarea } from "@/components/ui/textarea";
import { useCepLookup } from "@/hooks/use-cep-lookup";
import type { ClienteFormValues } from "@/lib/schemas/cliente";
import { cn } from "@/lib/utils";

type Campo = keyof ClienteFormValues;

interface ClienteCamposProps {
  // O `form` de quem usa, convertido para o formato de um cliente.
  form: UseFormReturn<ClienteFormValues>;
  // Caminho até os campos no formulário ("" no cadastro de cliente;
  // "passageiros.0." nos passageiros da Nova Viagem).
  prefixo?: string;
  // Layout horizontal (4 colunas em telas grandes) para páginas inteiras;
  // o padrão (2 colunas) serve para painéis laterais e diálogos.
  largo?: boolean;
  autoFocus?: boolean;
  // Campos extras logo após o nome (ex.: parentesco e bilhete do passageiro).
  extras?: ReactNode;
  // Endereço e observações começam recolhidos (passageiros da viagem).
  enderecoRecolhido?: boolean;
}

// Campos do cadastro de pessoa — os mesmos no Novo Cliente e nos passageiros.
export function ClienteCampos({
  form,
  prefixo = "",
  largo = false,
  autoFocus,
  extras,
  enderecoRecolhido = false,
}: ClienteCamposProps) {
  const { buscarCep, isLoading: isBuscandoCep } = useCepLookup();
  const [enderecoAberto, setEnderecoAberto] = useState(!enderecoRecolhido);
  const n = (campo: Campo) => `${prefixo}${campo}` as Campo;
  const ddi = form.watch(n("telefoneDdi")) || "+55";

  async function handleCepBlur(cep: string) {
    const endereco = await buscarCep(cep);
    if (!endereco) return;
    const opcoes = { shouldDirty: true };
    form.setValue(n("logradouro"), endereco.logradouro, opcoes);
    form.setValue(n("bairro"), endereco.bairro, opcoes);
    form.setValue(n("cidade"), endereco.cidade, opcoes);
    form.setValue(n("estado"), endereco.estado, opcoes);
  }

  const texto = (campo: Campo, label: string, opcoes: { placeholder?: string; type?: string; className?: string } = {}) => (
    <FormField
      control={form.control}
      name={n(campo)}
      render={({ field }) => (
        <FormItem className={opcoes.className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={opcoes.type} placeholder={opcoes.placeholder} {...field} value={field.value ?? ""} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className="space-y-5">
      <div className={cn("grid gap-5 sm:grid-cols-2", largo && "lg:grid-cols-4")}>
        <FormField
          control={form.control}
          name={n("nome")}
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input placeholder="Maria da Silva" autoFocus={autoFocus} {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {extras}
        {texto("email", "E-mail", { type: "email", placeholder: "maria@email.com" })}
        <FormField
          control={form.control}
          name={n("telefone")}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name={n("telefoneDdi")}
                  render={({ field: ddiField }) => (
                    <DdiSelect
                      value={ddiField.value || "+55"}
                      onChange={(novoDdi) => {
                        ddiField.onChange(novoDdi);
                        // Reaplica a máscara no formato do país escolhido.
                        field.onChange(formatTelefone(field.value ?? "", novoDdi));
                      }}
                    />
                  )}
                />
                <FormControl>
                  <TelefoneInput ddi={ddi} {...field} value={field.value ?? ""} />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        {texto("dataNascimento", "Data de nascimento", { type: "date" })}
        {texto("numeroPassaporte", "Número do passaporte", { placeholder: "FZ123456" })}
        {texto("validadePassaporte", "Validade do passaporte", { type: "date" })}
        <FormField
          control={form.control}
          name={n("rg")}
          render={({ field }) => (
            <FormItem>
              <FormLabel>RG</FormLabel>
              <FormControl>
                <RgInput {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={n("cpf")}
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF</FormLabel>
              <FormControl>
                <CpfInput {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {enderecoRecolhido && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground"
          onClick={() => setEnderecoAberto((aberto) => !aberto)}
          aria-expanded={enderecoAberto}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", enderecoAberto && "rotate-180")} />
          Endereço e observações (opcional)
        </Button>
      )}

      {enderecoAberto && (
        <>
        <div className="space-y-5 rounded-lg border border-border p-4">
          <p className="text-sm font-medium">Endereço</p>
          <div className={cn("grid gap-5 sm:grid-cols-6", largo && "lg:grid-cols-12")}>
            <FormField
              control={form.control}
              name={n("cep")}
              render={({ field }) => (
                <FormItem className={cn("sm:col-span-3", largo && "lg:col-span-2")}>
                  <FormLabel>CEP {isBuscandoCep && "(buscando...)"}</FormLabel>
                  <FormControl>
                    <CepInput
                      {...field}
                      value={field.value ?? ""}
                      onBlur={(event) => {
                        field.onBlur();
                        void handleCepBlur(event.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {texto("logradouro", "Logradouro", { placeholder: "Rua, avenida...", className: cn("sm:col-span-3", largo && "lg:col-span-5") })}
            {texto("numero", "Número", { placeholder: "123", className: cn("sm:col-span-2", largo && "lg:col-span-2") })}
            {texto("complemento", "Complemento", { placeholder: "Apto, bloco...", className: cn("sm:col-span-2", largo && "lg:col-span-3") })}
            {texto("bairro", "Bairro", { className: cn("sm:col-span-2", largo && "lg:col-span-5") })}
            {texto("cidade", "Cidade", { className: cn("sm:col-span-4", largo && "lg:col-span-5") })}
            <FormField
              control={form.control}
              name={n("estado")}
              render={({ field }) => (
                <FormItem className={cn("sm:col-span-2", largo && "lg:col-span-2")}>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input placeholder="UF" maxLength={2} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name={n("observacoes")}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Preferências, restrições, contexto relevante..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        </>
      )}
    </div>
  );
}
