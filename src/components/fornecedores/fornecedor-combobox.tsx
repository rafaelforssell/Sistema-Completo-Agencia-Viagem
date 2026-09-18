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
import { useFornecedores } from "@/hooks/use-fornecedores";
import { useDebounce } from "@/hooks/use-debounce";
import { TIPO_FORNECEDOR_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface FornecedorComboboxProps {
  value?: string;
  onChange: (fornecedorId: string) => void;
  placeholder?: string;
}

export function FornecedorCombobox({
  value,
  onChange,
  placeholder = "Selecione o fornecedor",
}: FornecedorComboboxProps) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const buscaDebounced = useDebounce(busca, 250);

  const { data, isFetching } = useFornecedores({ busca: buscaDebounced || undefined, porPagina: 20 });
  const fornecedores = data?.dados ?? [];
  const selecionado = fornecedores.find((f) => f.id === value);

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
            {selecionado?.nome ?? (value ? "Fornecedor selecionado" : placeholder)}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar fornecedor..." value={busca} onValueChange={setBusca} />
          <CommandList>
            {isFetching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isFetching && <CommandEmpty>Nenhum fornecedor encontrado.</CommandEmpty>}
            <CommandGroup>
              {fornecedores.map((fornecedor) => (
                <CommandItem
                  key={fornecedor.id}
                  value={fornecedor.id}
                  onSelect={() => {
                    onChange(fornecedor.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("h-4 w-4", value === fornecedor.id ? "opacity-100" : "opacity-0")} />
                  <div className="min-w-0">
                    <p className="truncate">{fornecedor.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {TIPO_FORNECEDOR_LABEL[fornecedor.tipo]}
                    </p>
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
