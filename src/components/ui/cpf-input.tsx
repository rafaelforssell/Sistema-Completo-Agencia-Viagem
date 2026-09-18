"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

function formatCpf(digits: string): string {
  return digits
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

interface CpfInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value?: string;
  onChange: (value: string) => void;
}

export const CpfInput = React.forwardRef<HTMLInputElement, CpfInputProps>(function CpfInput(
  { value = "", onChange, ...props },
  ref
) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "");
    onChange(formatCpf(digits));
  }

  return (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode="numeric"
      placeholder="000.000.000-00"
      value={value}
      onChange={handleChange}
    />
  );
});
