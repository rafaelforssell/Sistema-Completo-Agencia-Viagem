"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useViagens } from "@/hooks/use-viagens";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface ViagemComboboxProps {
  value?: string;
  onChange: (viagemId: string) => void;
  placeholder?: string;
}

export function ViagemCombobox({ value, onChange, placeholder = "Selecione a viagem" }: ViagemComboboxProps) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounce(busca, 250);

  const { data, isFetching } = useViagens({ busca: buscaDebounced || undefined, porPagina: 20 });
  const viagens = data?.dados ?? [];
  const selecionada = viagens.find((v) => v.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selecionada && !value && "text-muted-foreground")}>
            {selecionada ? `${selecionada.destino} · ${selecionada.cliente?.nome ?? ""}` : value ? "Viagem selecionada" : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar viagem por destino..." value={busca} onValueChange={setBusca} />
          <CommandList>
            {isFetching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isFetching && <CommandEmpty>Nenhuma viagem encontrada.</CommandEmpty>}
            <CommandGroup>
              {viagens.map((viagem) => (
                <CommandItem
                  key={viagem.id}
                  value={viagem.id}
                  onSelect={() => {
                    onChange(viagem.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("h-4 w-4", value === viagem.id ? "opacity-100" : "opacity-0")} />
                  <div className="min-w-0">
                    <p className="truncate">{viagem.destino}</p>
                    <p className="truncate text-xs text-muted-foreground">{viagem.cliente?.nome}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
