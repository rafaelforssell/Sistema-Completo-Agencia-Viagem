import express from "express";
import cors from "cors";
import { env } from "./env";
import { requireAuth } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { authRouter } from "./modules/auth/auth.routes";
import { clientesRouter } from "./modules/clientes/clientes.routes";
import { viagensRouter } from "./modules/viagens/viagens.routes";
import { pagamentosRouter } from "./modules/pagamentos/pagamentos.routes";
import { reembolsosRouter } from "./modules/reembolsos/reembolsos.routes";
import { contasRouter } from "./modules/contas/contas.routes";
import { comissoesRouter } from "./modules/comissoes/comissoes.routes";
import { anexosRouter } from "./modules/anexos/anexos.routes";
import { dashboardRouter, atividadesRouter, alertasRouter } from "./modules/dashboard/dashboard.routes";

export const app = express();

app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(env.uploadsDir));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Todas as rotas do contrato vivem sob /api, pois é isso que o frontend
// espera por padrão em API_BASE_URL (ver API_ENDPOINTS.md e .env.example).
const api = express.Router();

api.use("/auth", authRouter);

api.use("/clientes", requireAuth, clientesRouter);
api.use("/viagens", requireAuth, viagensRouter);
api.use("/pagamentos", requireAuth, pagamentosRouter);
api.use("/reembolsos", requireAuth, reembolsosRouter);
api.use("/contas", requireAuth, contasRouter);
api.use("/comissoes", requireAuth, comissoesRouter);
api.use("/anexos", requireAuth, anexosRouter);
api.use("/dashboard", requireAuth, dashboardRouter);
api.use("/atividades", requireAuth, atividadesRouter);
api.use("/alertas", requireAuth, alertasRouter);

app.use("/api", api);

app.use(notFoundHandler);
app.use(errorHandler);
