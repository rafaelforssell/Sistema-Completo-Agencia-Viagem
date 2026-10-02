"use client";

import type { UseFormReturn } from "react-hook-form";
import { ClienteCampos } from "@/components/clientes/cliente-campos";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { ClienteFormValues } from "@/lib/schemas/cliente";
import type { PassageiroFormValues } from "@/lib/schemas/viagem";
import type { Cliente, Passageiro } from "@/types/entities";

// Valores vazios de um passageiro novo (todos os campos do formulário).
export const PASSAGEIRO_VAZIO: PassageiroFormValues = {
  nome: "",
  parentesco: "",
  numeroBilhete: "",
  email: "",
  telefone: "",
  telefoneDdi: "+55",
  dataNascimento: "",
  numeroPassaporte: "",
  validadePassaporte: "",
  rg: "",
  cpf: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  observacoes: "",
};

// Preenche o formulário a partir de um passageiro existente ou de um
// cliente (ex.: "incluir o cliente como passageiro").
export function passageiroParaFormulario(origem?: Partial<Passageiro> | Cliente): PassageiroFormValues {
  if (!origem) return { ...PASSAGEIRO_VAZIO };
  const valores = { ...PASSAGEIRO_VAZIO };
  for (const campo of Object.keys(PASSAGEIRO_VAZIO) as (keyof PassageiroFormValues)[]) {
    const valor = (origem as Record<string, unknown>)[campo];
    if (typeof valor === "string" && valor) valores[campo] = valor;
  }
  valores.dataNascimento = valores.dataNascimento?.slice(0, 10);
  valores.validadePassaporte = valores.validadePassaporte?.slice(0, 10);
  return valores;
}

// Campos do passageiro: o mesmo cadastro do Novo Cliente (o passageiro
// também vira cliente) mais parentesco e nº do bilhete. Usado na aba
// Passageiros e nos passageiros adicionados direto na Nova Viagem.
// `prefixo` é o caminho até o passageiro no formulário ("" na aba;
// "passageiros.0." na viagem).
export function PassageiroCampos({
  form,
  prefixo = "",
  autoFocus,
  largo,
  enderecoRecolhido,
}: {
  form: UseFormReturn<PassageiroFormValues>;
  prefixo?: string;
  autoFocus?: boolean;
  largo?: boolean;
  enderecoRecolhido?: boolean;
}) {
  const n = (campo: "parentesco" | "numeroBilhete") => `${prefixo}${campo}` as keyof PassageiroFormValues;

  return (
    <ClienteCampos
      form={form as unknown as UseFormReturn<ClienteFormValues>}
      prefixo={prefixo}
      autoFocus={autoFocus}
      largo={largo}
      enderecoRecolhido={enderecoRecolhido}
      extras={
        <>
          <FormField
            control={form.control}
            name={n("parentesco")}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parentesco</FormLabel>
                <FormControl>
                  <Input placeholder="Cônjuge, filho(a)..." {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={n("numeroBilhete")}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nº do bilhete aéreo</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      }
    />
  );
}
