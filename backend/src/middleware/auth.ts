import type { NextFunction, Request, Response } from "express";
import { verifyToken, type TokenPayload } from "../lib/jwt";
import { HttpError } from "../lib/http-error";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return next(HttpError.unauthorized());
  }

  try {
    req.admin = verifyToken(token);
    next();
  } catch {
    next(HttpError.unauthorized("Sessão inválida ou expirada."));
  }
}
