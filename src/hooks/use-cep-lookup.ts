import { useState } from "react";
import { toast } from "sonner";

interface EnderecoViaCep {
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface ViaCepResponse {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

// Consulta o CEP direto no ViaCEP (API pública, sem chave, CORS liberado) —
// não precisa passar pelo BFF do backend.
export function useCepLookup() {
  const [isLoading, setIsLoading] = useState(false);

  async function buscarCep(cep: string): Promise<EnderecoViaCep | null> {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return null;

    setIsLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data: ViaCepResponse = await response.json();
      if (!response.ok || data.erro) {
        toast.error("CEP não encontrado.");
        return null;
      }
      return {
        logradouro: data.logradouro ?? "",
        bairro: data.bairro ?? "",
        cidade: data.localidade ?? "",
        estado: data.uf ?? "",
      };
    } catch {
      toast.error("Não foi possível consultar o CEP.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { buscarCep, isLoading };
}
