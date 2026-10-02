"use client";

import { useSyncExternalStore } from "react";

// true enquanto a media query casa (ex.: "(min-width: 1536px)"). No servidor
// e na primeira renderização devolve false — o layout se ajusta logo em seguida.
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", avisar);
      return () => media.removeEventListener("change", avisar);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
