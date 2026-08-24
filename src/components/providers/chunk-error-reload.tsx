"use client";

import { useEffect } from "react";

const RELOAD_FLAG = "sav_chunk_reload";

function isChunkLoadError(message: unknown): boolean {
  const text = String(message ?? "");
  return (
    text.includes("ChunkLoadError") ||
    text.includes("Loading chunk") ||
    text.includes("Failed to fetch dynamically imported module")
  );
}

// Depois de um novo deploy, os arquivos JS trocam de nome. Uma aba que já
// estava aberta desde antes tenta buscar os arquivos antigos e falha com
// ChunkLoadError, o que aparece pro usuário como "Application error".
// Em vez de deixar a tela quebrada, recarrega a página automaticamente uma
// única vez (a flag evita loop se o problema persistir).
export function ChunkErrorReload() {
  useEffect(() => {
    // Chegou até aqui e renderizou — os chunks desta carga funcionaram, então
    // libera a flag para que um próximo erro (de um deploy futuro) também
    // dispare um reload, em vez de ficar bloqueado pela flag antiga.
    sessionStorage.removeItem(RELOAD_FLAG);

    function handleReload(message: unknown) {
      if (!isChunkLoadError(message)) return;
      if (sessionStorage.getItem(RELOAD_FLAG)) return;
      sessionStorage.setItem(RELOAD_FLAG, "1");
      window.location.reload();
    }

    function onError(event: ErrorEvent) {
      handleReload(event.message);
    }
    function onRejection(event: PromiseRejectionEvent) {
      handleReload(event.reason?.message ?? event.reason);
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
