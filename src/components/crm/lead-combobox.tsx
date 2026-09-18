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
import { useLeads } from "@/hooks/use-leads";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface LeadComboboxProps {
  value?: string;
  onChange: (leadId: string) => void;
  placeholder?: string;
}

export function LeadCombobox({ value, onChange, placeholder = "Selecione o lead" }: LeadComboboxProps) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounce(busca, 250);

  const { data, isFetching } = useLeads({ busca: buscaDebounced || undefined, porPagina: 20 });
  const leads = data?.dados ?? [];
  const selecionado = leads.find((l) => l.id === value);

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
            {selecionado?.nome ?? (value ? "Lead selecionado" : placeholder)}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar lead..." value={busca} onValueChange={setBusca} />
          <CommandList>
            {isFetching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isFetching && <CommandEmpty>Nenhum lead encontrado.</CommandEmpty>}
            <CommandGroup>
              {leads.map((lead) => (
                <CommandItem
                  key={lead.id}
                  value={lead.id}
                  onSelect={() => {
                    onChange(lead.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("h-4 w-4", value === lead.id ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{lead.nome}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
