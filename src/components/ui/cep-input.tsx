"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

function formatCep(digits: string): string {
  return digits.slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}

interface CepInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value?: string;
  onChange: (value: string) => void;
}

export const CepInput = React.forwardRef<HTMLInputElement, CepInputProps>(function CepInput(
  { value = "", onChange, ...props },
  ref
) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "");
    onChange(formatCep(digits));
  }

  return (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode="numeric"
      placeholder="00000-000"
      value={value}
      onChange={handleChange}
    />
  );
});
