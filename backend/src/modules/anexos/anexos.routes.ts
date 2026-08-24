import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import type { Anexo } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { env } from "../../env";
import { HttpError } from "../../lib/http-error";
import { asyncHandler } from "../../middleware/async-handler";

fs.mkdirSync(env.uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: env.uploadMaxBytes },
});

const anexoQuerySchema = z.object({
  clienteId: z.string().uuid().optional(),
  viagemId: z.string().uuid().optional(),
  passageiroId: z.string().uuid().optional(),
});

const anexoBodySchema = z.object({
  tipo: z.enum(["passaporte", "rg", "cpf", "visto", "outro"]),
  clienteId: z.string().uuid().optional().or(z.literal("")),
  viagemId: z.string().uuid().optional().or(z.literal("")),
  passageiroId: z.string().uuid().optional().or(z.literal("")),
});

export function serializeAnexo(anexo: Anexo) {
  return {
    id: anexo.id,
    tipo: anexo.tipo,
    nomeArquivo: anexo.nomeArquivo,
    url: `${env.publicUrl}/uploads/${path.basename(anexo.caminhoArquivo)}`,
    tamanhoBytes: anexo.tamanhoBytes,
    mimeType: anexo.mimeType,
    clienteId: anexo.clienteId ?? undefined,
    viagemId: anexo.viagemId ?? undefined,
    passageiroId: anexo.passageiroId ?? undefined,
    criadoEm: anexo.criadoEm.toISOString(),
    atualizadoEm: anexo.atualizadoEm.toISOString(),
  };
}

export const anexosRouter = Router();

anexosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = anexoQuerySchema.parse(req.query);
    if (!query.clienteId && !query.viagemId && !query.passageiroId) {
      throw HttpError.badRequest("Informe clienteId, viagemId ou passageiroId.");
    }

    const anexos = await prisma.anexo.findMany({
      where: {
        clienteId: query.clienteId,
        viagemId: query.viagemId,
        passageiroId: query.passageiroId,
      },
      orderBy: { criadoEm: "desc" },
    });

    res.json(anexos.map(serializeAnexo));
  })
);

anexosRouter.post(
  "/",
  upload.single("arquivo"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw HttpError.badRequest("Envie um arquivo no campo 'arquivo'.");

    const body = anexoBodySchema.parse(req.body);
    if (!body.clienteId && !body.viagemId && !body.passageiroId) {
      fs.unlink(req.file.path, () => undefined);
      throw HttpError.badRequest("Informe clienteId, viagemId ou passageiroId.");
    }

    const anexo = await prisma.anexo.create({
      data: {
        tipo: body.tipo,
        nomeArquivo: req.file.originalname,
        caminhoArquivo: req.file.filename,
        mimeType: req.file.mimetype,
        tamanhoBytes: req.file.size,
        clienteId: body.clienteId || null,
        viagemId: body.viagemId || null,
        passageiroId: body.passageiroId || null,
      },
    });

    res.status(201).json(serializeAnexo(anexo));
  })
);

anexosRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const anexo = await prisma.anexo.findUnique({ where: { id: req.params.id } });
    if (!anexo) throw HttpError.notFound("Anexo não encontrado.");

    await prisma.anexo.delete({ where: { id: anexo.id } });
    fs.unlink(path.join(env.uploadsDir, anexo.caminhoArquivo), () => undefined);

    res.status(204).send();
  })
);
