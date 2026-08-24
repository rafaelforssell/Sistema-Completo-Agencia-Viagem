"use client";

import Link from "next/link";
import { Plane, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function QuickAdd() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/clientes/novo">
            <UserPlus className="h-4 w-4" />
            Novo cliente
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/viagens/nova">
            <Plane className="h-4 w-4" />
            Nova viagem
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
