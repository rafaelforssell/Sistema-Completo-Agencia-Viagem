import type { Request } from "express";

export interface PaginationInput {
  pagina: number;
  porPagina: number;
  skip: number;
  take: number;
  busca?: string;
  ordenarPor?: string;
  ordem: "asc" | "desc";
}

export function parsePagination(req: Request, defaultOrderBy = "criadoEm"): PaginationInput {
  const pagina = Math.max(1, Number(req.query.pagina) || 1);
  const porPagina = Math.min(100, Math.max(1, Number(req.query.porPagina) || 10));
  const busca = typeof req.query.busca === "string" && req.query.busca.trim() ? req.query.busca.trim() : undefined;
  const ordenarPor = typeof req.query.ordenarPor === "string" ? req.query.ordenarPor : defaultOrderBy;
  const ordem = req.query.ordem === "asc" ? "asc" : "desc";

  return {
    pagina,
    porPagina,
    skip: (pagina - 1) * porPagina,
    take: porPagina,
    busca,
    ordenarPor,
    ordem,
  };
}

export function paginatedResponse<T>(dados: T[], total: number, pagination: PaginationInput) {
  return {
    dados,
    total,
    pagina: pagination.pagina,
    porPagina: pagination.porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / pagination.porPagina)),
  };
}
