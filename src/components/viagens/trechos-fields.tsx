"use client";

import { Fragment, useState } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { ChevronDown, Loader2, PlaneLanding, PlaneTakeoff, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ConexaoInfo } from "@/components/viagens/conexao-info";
import { useBuscarVoo } from "@/hooks/use-integracoes";
import type { TrechoFormValues, ViagemFormValues } from "@/lib/schemas/viagem";
import { cn } from "@/lib/utils";
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

type CampoTrecho = `trechos.${number}.${Exclude<keyof TrechoFormValues, "sentido">}`;

// Itinerário da viagem, separado em Ida e Volta. Cada voo é um trecho; uma
// conexão é o voo seguinte no mesmo sentido, saindo de onde o anterior
// chegou. A busca por nº do voo preenche o trecho; tudo continua editável.
export function TrechosFields({ form }: { form: UseFormReturn<ViagemFormValues> }) {
  const trechos = useFieldArray({ control: form.control, name: "trechos" });
  const valores = form.watch("trechos") ?? [];
  const buscarVoo = useBuscarVoo();
  const [buscandoIndex, setBuscandoIndex] = useState<number | null>(null);
  const [detalhesAbertos, setDetalhesAbertos] = useState<Set<string>>(new Set());

  // Índices (no array do formulário) dos voos de cada sentido, em ordem.
  const indices = (sentido: SentidoTrecho) =>
    trechos.fields.map((_, i) => i).filter((i) => valores[i]?.sentido === sentido);

  function adicionar(sentido: SentidoTrecho) {
    const doSentido = indices(sentido);
    const ultimo = doSentido.at(-1);
    // Ida fica antes da volta; dentro do sentido, o novo voo entra no fim.
    const posicao = ultimo !== undefined ? ultimo + 1 : sentido === "ida" ? 0 : trechos.fields.length;
    const anterior = ultimo !== undefined ? valores[ultimo] : undefined;
    trechos.insert(posicao, {
      sentido,
      ...TRECHO_VAZIO,
      // Conexão: sai de onde o voo anterior chegou, normalmente na mesma cia.
      origemIata: anterior?.destinoIata ?? "",
      origemAeroporto: anterior?.destinoAeroporto ?? "",
      companhia: anterior?.companhia ?? "",
    });
  }

  function alternarDetalhes(id: string) {
    setDetalhesAbertos((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
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

  function grupo(sentido: SentidoTrecho) {
    const doSentido = indices(sentido);
    const Icone = sentido === "ida" ? PlaneTakeoff : PlaneLanding;
    const titulo = sentido === "ida" ? "Ida" : "Volta";
    const conexoes = Math.max(doSentido.length - 1, 0);

    return (
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icone className="h-4 w-4" />
          {titulo}
          {doSentido.length > 0 &&
            ` · ${conexoes === 0 ? "sem conexão" : `${conexoes} ${conexoes === 1 ? "conexão" : "conexões"}`}`}
        </p>

        {doSentido.map((index, posicao) => {
          const id = trechos.fields[index].id;
          const aberto = detalhesAbertos.has(id);
          const buscando = buscarVoo.isPending && buscandoIndex === index;
          const anterior = posicao > 0 ? valores[doSentido[posicao - 1]] : undefined;
          return (
            <Fragment key={id}>
              {anterior && <ConexaoInfo anterior={anterior} proximo={valores[index] ?? {}} />}
              <div className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-end gap-2">
                  <Campo
                    form={form}
                    name={`trechos.${index}.numeroVoo`}
                    label="Nº do voo"
                    placeholder="LA3400"
                    onEnter={() => buscar(index)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => buscar(index)}
                    disabled={buscarVoo.isPending}
                    aria-label="Buscar voo"
                  >
                    {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => alternarDetalhes(id)}
                    aria-expanded={aberto}
                  >
                    Mais detalhes
                    <ChevronDown className={cn("h-4 w-4 transition-transform", aberto && "rotate-180")} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={() => trechos.remove(index)}
                    aria-label="Remover voo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-end gap-2">
                    <Campo form={form} name={`trechos.${index}.origemIata`} label="Partida" placeholder="GRU" />
                    <Campo
                      form={form}
                      name={`trechos.${index}.partidaPrevista`}
                      type="datetime-local"
                      ariaLabel="Horário de partida"
                    />
                  </div>
                  <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-end gap-2">
                    <Campo form={form} name={`trechos.${index}.destinoIata`} label="Chegada" placeholder="LIS" />
                    <Campo
                      form={form}
                      name={`trechos.${index}.chegadaPrevista`}
                      type="datetime-local"
                      ariaLabel="Horário de chegada"
                    />
                  </div>
                </div>

                {aberto && (
                  <div className="grid gap-2 border-t border-border pt-2 sm:grid-cols-2 lg:grid-cols-4">
                    <Campo form={form} name={`trechos.${index}.companhia`} label="Companhia" />
                    <Campo form={form} name={`trechos.${index}.origemAeroporto`} label="Aeroporto de partida" />
                    <Campo form={form} name={`trechos.${index}.destinoAeroporto`} label="Aeroporto de chegada" />
                    <Campo form={form} name={`trechos.${index}.aeronave`} label="Aeronave" />
                    <Campo form={form} name={`trechos.${index}.terminalPartida`} label="Terminal de partida" />
                    <Campo form={form} name={`trechos.${index}.terminalChegada`} label="Terminal de chegada" />
                    <Campo form={form} name={`trechos.${index}.classe`} label="Classe" placeholder="Econômica" />
                    <Campo form={form} name={`trechos.${index}.bagagem`} label="Bagagem" placeholder="1x 23kg" />
                  </div>
                )}
              </div>
            </Fragment>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(doSentido.length > 0 && "border-primary/40 text-primary hover:text-primary")}
          onClick={() => adicionar(sentido)}
        >
          <Plus className="h-4 w-4" />
          {doSentido.length > 0 ? `Adicionar conexão na ${sentido}` : `Adicionar voo de ${sentido}`}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div>
        <p className="text-sm font-medium">Voos</p>
        <p className="text-xs text-muted-foreground">
          Para uma conexão, adicione o próximo voo — ele já sai do aeroporto onde o anterior chega. As datas de ida e
          volta são preenchidas a partir daqui.
        </p>
      </div>
      {grupo("ida")}
      <div className="border-t border-border pt-4">{grupo("volta")}</div>
    </div>
  );
}

function Campo({
  form,
  name,
  label,
  placeholder,
  type,
  ariaLabel,
  onEnter,
}: {
  form: UseFormReturn<ViagemFormValues>;
  name: CampoTrecho;
  label?: string;
  placeholder?: string;
  type?: string;
  ariaLabel?: string;
  onEnter?: () => void;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="min-w-0 flex-1">
          {label && <FormLabel className="text-xs">{label}</FormLabel>}
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              aria-label={ariaLabel ?? label}
              {...field}
              value={field.value ?? ""}
              onKeyDown={
                onEnter
                  ? (e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onEnter();
                      }
                    }
                  : undefined
              }
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
