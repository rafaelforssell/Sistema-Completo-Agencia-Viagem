"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

// RG no formato 00.000.000-0. O dígito verificador pode ser "X".
export function formatRg(valor: string): string {
  const limpo = valor.toUpperCase().replace(/[^\dX]/g, "");
  // "X" só é válido como último caractere (dígito verificador).
  const corpo = limpo.slice(0, 8).replace(/X/g, "");
  const dv = limpo.slice(corpo.length, corpo.length + 1);
  const chars = (corpo.length === 8 ? corpo + dv : corpo).slice(0, 9);
  return chars
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})([\dX])$/, ".$1-$2");
}

interface RgInputProps extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value?: string;
  onChange: (value: string) => void;
}

export const RgInput = React.forwardRef<HTMLInputElement, RgInputProps>(function RgInput(
  { value = "", onChange, ...props },
  ref
) {
  return (
    <Input
      {...props}
      ref={ref}
      type="text"
      placeholder="00.000.000-0"
      value={value}
      onChange={(event) => onChange(formatRg(event.target.value))}
    />
  );
});
