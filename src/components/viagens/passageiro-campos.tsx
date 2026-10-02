"use client";

import type { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TelefoneInput } from "@/components/ui/telefone-input";
import type { PassageiroFormValues } from "@/lib/schemas/viagem";

// Campos do passageiro — os mesmos no cadastro da aba Passageiros e nos
// passageiros adicionados direto na Nova Viagem. `prefixo` é o caminho até o
// passageiro no formulário ("" na aba; "passageiros.0." na viagem), e o
// `form` vem convertido para o formato de um passageiro.
export function PassageiroCampos({
  form,
  prefixo = "",
  autoFocus,
}: {
  form: UseFormReturn<PassageiroFormValues>;
  prefixo?: string;
  autoFocus?: boolean;
}) {
  const nome = (campo: keyof PassageiroFormValues) => `${prefixo}${campo}` as keyof PassageiroFormValues;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name={nome("nome")}
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Nome completo</FormLabel>
            <FormControl>
              <Input placeholder="João da Silva" autoFocus={autoFocus} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={nome("parentesco")}
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
        name={nome("email")}
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
        name={nome("telefone")}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Telefone</FormLabel>
            <FormControl>
              <TelefoneInput {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={nome("dataNascimento")}
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
        name={nome("numeroPassaporte")}
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
        name={nome("validadePassaporte")}
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
        name={nome("numeroBilhete")}
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
  );
}
