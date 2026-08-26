"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

function centsToDisplay(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

interface CurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: number;
  onChange: (value: number) => void;
}

// Input mascarado de moeda: o usuário só digita números, que são
// interpretados como centavos da direita pra esquerda (padrão de app
// bancário brasileiro) — evita erro de vírgula/ponto no valor monetário.
export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput({ value, onChange, ...props }, ref) {
    const cents = Math.round((value || 0) * 100);
    const display = centsToDisplay(cents);

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
      const digits = event.target.value.replace(/\D/g, "");
      const nextCents = digits ? parseInt(digits, 10) : 0;
      onChange(nextCents / 100);
    }

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        value={display}
        onChange={handleChange}
      />
    );
  }
);
