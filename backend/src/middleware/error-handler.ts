import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { HttpError } from "../lib/http-error";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ mensagem: `Rota não encontrada: ${req.method} ${req.path}` });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ mensagem: err.message, detalhes: err.detalhes });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      mensagem: "Dados inválidos.",
      detalhes: err.flatten(),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return res.status(404).json({ mensagem: "Recurso não encontrado." });
    }
    if (err.code === "P2002") {
      return res.status(409).json({ mensagem: "Já existe um registro com esses dados." });
    }
  }

  console.error(err);
  return res.status(500).json({ mensagem: "Erro interno no servidor." });
}
