"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Download,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { useAnexos, useEnviarAnexo, useRemoverAnexo } from "@/hooks/use-anexos";
import { TIPO_DOCUMENTO_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AnexosFiltro } from "@/lib/api/anexos";
import type { TipoDocumento } from "@/types/entities";

const MAX_SIZE_MB = 15;

function iconFor(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType === "application/pdf") return FileText;
  return FileIcon;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentsPanelProps extends AnexosFiltro {
  title?: string;
}

export function AttachmentsPanel({ title = "Documentos", ...filtro }: AttachmentsPanelProps) {
  const [tipo, setTipo] = useState<TipoDocumento>("outro");
  const [removeId, setRemoveId] = useState<string | null>(null);

  const { data: anexos, isLoading } = useAnexos(filtro);
  const enviarAnexo = useEnviarAnexo(filtro);
  const removerAnexo = useRemoverAnexo(filtro);

  const onDrop = useCallback(
    (accepted: File[]) => {
      accepted.forEach((arquivo) => {
        if (arquivo.size > MAX_SIZE_MB * 1024 * 1024) return;
        enviarAnexo.mutate({ arquivo, tipo, ...filtro });
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tipo, filtro.clienteId, filtro.viagemId, filtro.passageiroId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_SIZE_MB * 1024 * 1024,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium">{title}</p>
        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoDocumento)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tipo de documento" />
          </SelectTrigger>
          <SelectContent>
            {TIPO_DOCUMENTO_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-8 text-center transition-colors",
          isDragActive && "border-primary bg-primary/5"
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">
          Arraste arquivos aqui ou clique para selecionar
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, imagens ou documentos · até {MAX_SIZE_MB}MB
        </p>
      </div>

      <div className="space-y-1.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : !anexos || anexos.length === 0 ? (
          <EmptyState title="Nenhum documento anexado" description="Envie passaportes, RG ou outros arquivos relacionados." />
        ) : (
          anexos.map((anexo) => {
            const Icon = iconFor(anexo.mimeType);
            return (
              <div
                key={anexo.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{anexo.nomeArquivo}</p>
                  <p className="text-xs text-muted-foreground">
                    {TIPO_DOCUMENTO_OPTIONS.find((o) => o.value === anexo.tipo)?.label} ·{" "}
                    {formatBytes(anexo.tamanhoBytes)}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href={anexo.url} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setRemoveId(anexo.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={Boolean(removeId)}
        onOpenChange={(open) => !open && setRemoveId(null)}
        title="Remover documento"
        description="Esta ação não pode ser desfeita. O arquivo será removido permanentemente."
        confirmLabel="Remover"
        isLoading={removerAnexo.isPending}
        onConfirm={() => {
          if (!removeId) return;
          removerAnexo.mutate(removeId, { onSuccess: () => setRemoveId(null) });
        }}
      />
    </div>
  );
}
