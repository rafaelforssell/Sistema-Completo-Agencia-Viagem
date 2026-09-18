"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { PAISES_DDI } from "@/lib/country-codes";
import { cn } from "@/lib/utils";

interface DdiSelectProps {
  value?: string;
  onChange: (ddi: string) => void;
}

export function DdiSelect({ value, onChange }: DdiSelectProps) {
  const [open, setOpen] = useState(false);
  const selecionado = PAISES_DDI.find((pais) => pais.ddi === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-28 shrink-0 justify-between font-normal"
        >
          <span className="truncate">{selecionado?.ddi ?? value ?? "DDI"}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar país..." />
          <CommandList>
            <CommandEmpty>Nenhum país encontrado.</CommandEmpty>
            <CommandGroup>
              {PAISES_DDI.map((pais) => (
                <CommandItem
                  key={pais.nome}
                  value={`${pais.nome} ${pais.ddi}`}
                  onSelect={() => {
                    onChange(pais.ddi);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("h-4 w-4", value === pais.ddi ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{pais.nome}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">{pais.ddi}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
