import { http } from "@/lib/http";
import type { DocumentoAnexo, TipoDocumento } from "@/types/entities";

export interface AnexosFiltro {
  clienteId?: string;
  viagemId?: string;
  passageiroId?: string;
}

export interface NovoAnexoInput {
  arquivo: File;
  tipo: TipoDocumento;
  clienteId?: string;
  viagemId?: string;
  passageiroId?: string;
}

export const anexosApi = {
  listar: (params: AnexosFiltro) =>
    http.get<DocumentoAnexo[]>("/anexos", params),
  enviar: ({ arquivo, ...rest }: NovoAnexoInput) => {
    const formData = new FormData();
    formData.append("arquivo", arquivo);
    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, value);
    });
    return http.post<DocumentoAnexo>("/anexos", formData);
  },
  remover: (id: string) => http.delete<void>(`/anexos/${id}`),
};
