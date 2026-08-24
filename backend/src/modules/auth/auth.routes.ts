import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { comparePassword } from "../../lib/password";
import { signToken } from "../../lib/jwt";
import { HttpError } from "../../lib/http-error";
import { asyncHandler } from "../../middleware/async-handler";
import { requireAuth } from "../../middleware/auth";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, senha } = loginSchema.parse(req.body);

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) throw HttpError.unauthorized("E-mail ou senha inválidos.");

    const senhaValida = await comparePassword(senha, admin.senhaHash);
    if (!senhaValida) throw HttpError.unauthorized("E-mail ou senha inválidos.");

    const token = signToken({ sub: admin.id, nome: admin.nome, email: admin.email });

    res.json({
      token,
      admin: { id: admin.id, nome: admin.nome, email: admin.email },
    });
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const admin = await prisma.admin.findUnique({ where: { id: req.admin!.sub } });
    if (!admin) throw HttpError.unauthorized();
    res.json({ id: admin.id, nome: admin.nome, email: admin.email });
  })
);
