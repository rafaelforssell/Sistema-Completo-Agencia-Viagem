"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

// Formata enquanto digita, conforme o DDI. Brasil e EUA/Canadá têm formato
// fixo; para os demais países não há um padrão único, então só agrupamos os
// dígitos (máx. 15, limite do padrão internacional E.164).
export function formatTelefone(valor: string, ddi = "+55"): string {
  const digits = valor.replace(/\D/g, "");

  if (ddi === "+55") {
    const d = digits.slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : "";
    const ddd = `(${d.slice(0, 2)}) `;
    const numero = d.slice(2);
    // Celular (9 dígitos) → 99999-9999; fixo (8 dígitos) → 9999-9999.
    const corte = numero.length > 8 ? 5 : 4;
    return numero.length > corte ? `${ddd}${numero.slice(0, corte)}-${numero.slice(corte)}` : `${ddd}${numero}`;
  }

  if (ddi === "+1") {
    const d = digits.slice(0, 10);
    if (d.length <= 3) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }

  return digits
    .slice(0, 15)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim();
}

const PLACEHOLDER: Record<string, string> = {
  "+55": "(11) 99999-9999",
  "+1": "(555) 555-5555",
};

interface TelefoneInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value?: string;
  onChange: (value: string) => void;
  ddi?: string;
}

export const TelefoneInput = React.forwardRef<HTMLInputElement, TelefoneInputProps>(function TelefoneInput(
  { value = "", onChange, ddi = "+55", placeholder, ...props },
  ref
) {
  return (
    <Input
      {...props}
      ref={ref}
      type="tel"
      inputMode="tel"
      placeholder={placeholder ?? PLACEHOLDER[ddi] ?? "Número com código de área"}
      value={value}
      onChange={(event) => onChange(formatTelefone(event.target.value, ddi))}
    />
  );
});
