"use client";

import { useState } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Loader2, PlaneLanding, PlaneTakeoff, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useBuscarVoo } from "@/hooks/use-integracoes";
import type { ViagemFormValues } from "@/lib/schemas/viagem";
import type { SentidoTrecho } from "@/types/entities";

const TRECHO_VAZIO = {
  numeroVoo: "",
  companhia: "",
  origemIata: "",
  origemAeroporto: "",
  destinoIata: "",
  destinoAeroporto: "",
  partidaPrevista: "",
  chegadaPrevista: "",
  terminalPartida: "",
  terminalChegada: "",
  aeronave: "",
  classe: "",
  bagagem: "",
};

// Itinerário da viagem: cada voo (ida, conexões, volta) é um trecho. A
// busca por número do voo preenche o trecho; tudo continua editável à mão.
export function TrechosFields({ form }: { form: UseFormReturn<ViagemFormValues> }) {
  const trechos = useFieldArray({ control: form.control, name: "trechos" });
  const buscarVoo = useBuscarVoo();
  const [buscandoIndex, setBuscandoIndex] = useState<number | null>(null);

  function adicionar(sentido: SentidoTrecho) {
    // Trechos de ida ficam antes dos de volta, na ordem em que foram adicionados.
    const valores = form.getValues("trechos");
    const posicao = sentido === "ida" ? valores.filter((t) => t.sentido === "ida").length : valores.length;
    trechos.insert(posicao, { sentido, ...TRECHO_VAZIO });
  }

  function buscar(index: number) {
    const numero = form.getValues(`trechos.${index}.numeroVoo`)?.trim();
    if (!numero) return;
    setBuscandoIndex(index);
    buscarVoo.mutate(numero, {
      onSuccess: (dados) => {
        const opcoes = { shouldDirty: true };
        form.setValue(`trechos.${index}.numeroVoo`, dados.voo.iata, opcoes);
        form.setValue(`trechos.${index}.companhia`, dados.companhia.nome, opcoes);
        form.setValue(`trechos.${index}.origemIata`, dados.partida.iata, opcoes);
        form.setValue(`trechos.${index}.origemAeroporto`, dados.partida.aeroporto, opcoes);
        form.setValue(`trechos.${index}.destinoIata`, dados.chegada.iata, opcoes);
        form.setValue(`trechos.${index}.destinoAeroporto`, dados.chegada.aeroporto, opcoes);
        form.setValue(`trechos.${index}.partidaPrevista`, dados.partida.horarioPrevisto?.slice(0, 16) ?? "", opcoes);
        form.setValue(`trechos.${index}.chegadaPrevista`, dados.chegada.horarioPrevisto?.slice(0, 16) ?? "", opcoes);
        form.setValue(`trechos.${index}.terminalPartida`, dados.partida.terminal ?? "", opcoes);
        form.setValue(`trechos.${index}.terminalChegada`, dados.chegada.terminal ?? "", opcoes);
        form.setValue(`trechos.${index}.aeronave`, dados.aeronave?.tipoIata ?? "", opcoes);
      },
      onSettled: () => setBuscandoIndex(null),
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Voos</p>
          <p className="text-xs text-muted-foreground">
            Um trecho por voo — conexões entram como trechos extras. As datas de ida e volta são preenchidas a partir daqui.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => adicionar("ida")}>
            <Plus className="h-4 w-4" />
            Trecho de ida
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => adicionar("volta")}>
            <Plus className="h-4 w-4" />
            Trecho de volta
          </Button>
        </div>
      </div>

      {trechos.fields.length === 0 && (
        <p className="text-xs text-muted-foreground">Nenhum voo adicionado.</p>
      )}

      {trechos.fields.map((trecho, index) => {
        const sentido = form.watch(`trechos.${index}.sentido`);
        const Icone = sentido === "ida" ? PlaneTakeoff : PlaneLanding;
        const buscando = buscarVoo.isPending && buscandoIndex === index;
        return (
          <div key={trecho.id} className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Icone className="h-4 w-4 text-muted-foreground" />
                {sentido === "ida" ? "Ida" : "Volta"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => trechos.remove(index)}
                aria-label="Remover trecho"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-end gap-2">
              <FormField
                control={form.control}
                name={`trechos.${index}.numeroVoo`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs">Nº do voo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex.: LA3400"
                        {...field}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            buscar(index);
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="button" variant="outline" onClick={() => buscar(index)} disabled={buscarVoo.isPending}>
                {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </Button>
              <FormField
                control={form.control}
                name={`trechos.${index}.companhia`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs">Companhia</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Partida</p>
                <div className="grid grid-cols-[5rem_1fr] gap-2">
                  <CampoTexto form={form} name={`trechos.${index}.origemIata`} placeholder="GRU" />
                  <CampoTexto form={form} name={`trechos.${index}.origemAeroporto`} placeholder="Aeroporto" />
                </div>
                <div className="grid grid-cols-[1fr_5rem] gap-2">
                  <CampoTexto form={form} name={`trechos.${index}.partidaPrevista`} type="datetime-local" placeholder="Horário de partida" />
                  <CampoTexto form={form} name={`trechos.${index}.terminalPartida`} placeholder="Term." />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Chegada</p>
                <div className="grid grid-cols-[5rem_1fr] gap-2">
                  <CampoTexto form={form} name={`trechos.${index}.destinoIata`} placeholder="LIS" />
                  <CampoTexto form={form} name={`trechos.${index}.destinoAeroporto`} placeholder="Aeroporto" />
                </div>
                <div className="grid grid-cols-[1fr_5rem] gap-2">
                  <CampoTexto form={form} name={`trechos.${index}.chegadaPrevista`} type="datetime-local" placeholder="Horário de chegada" />
                  <CampoTexto form={form} name={`trechos.${index}.terminalChegada`} placeholder="Term." />
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <CampoTexto form={form} name={`trechos.${index}.classe`} placeholder="Classe (ex.: Econômica)" />
              <CampoTexto form={form} name={`trechos.${index}.bagagem`} placeholder="Bagagem (ex.: 1x 23kg)" />
              <CampoTexto form={form} name={`trechos.${index}.aeronave`} placeholder="Aeronave" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

type CampoTrecho = `trechos.${number}.${Exclude<keyof ViagemFormValues["trechos"][number], "sentido">}`;

function CampoTexto({
  form,
  name,
  placeholder,
  type,
}: {
  form: UseFormReturn<ViagemFormValues>;
  name: CampoTrecho;
  placeholder?: string;
  type?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input type={type} placeholder={placeholder} aria-label={placeholder} {...field} value={field.value ?? ""} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
