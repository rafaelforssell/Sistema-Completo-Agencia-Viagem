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
import { useClientes } from "@/hooks/use-clientes";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface ClienteComboboxProps {
  value?: string;
  onChange: (clienteId: string, nome: string) => void;
  placeholder?: string;
}

export function ClienteCombobox({ value, onChange, placeholder = "Selecione o cliente" }: ClienteComboboxProps) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounce(busca, 250);

  const { data, isFetching } = useClientes({ busca: buscaDebounced || undefined, porPagina: 20 });
  const clientes = data?.dados ?? [];
  const selecionado = clientes.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !selecionado && !value && "text-muted-foreground")}>
            {selecionado?.nome ?? (value ? "Cliente selecionado" : placeholder)}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar cliente..."
            value={busca}
            onValueChange={setBusca}
          />
          <CommandList>
            {isFetching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isFetching && <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>}
            <CommandGroup>
              {clientes.map((cliente) => (
                <CommandItem
                  key={cliente.id}
                  value={cliente.id}
                  onSelect={() => {
                    onChange(cliente.id, cliente.nome);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("h-4 w-4", value === cliente.id ? "opacity-100" : "opacity-0")}
                  />
                  <div className="min-w-0">
                    <p className="truncate">{cliente.nome}</p>
                    {cliente.email && (
                      <p className="truncate text-xs text-muted-foreground">{cliente.email}</p>
                    )}
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
