import "dotenv/config";
import path from "node:path";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

// Alguns painéis de hospedagem preenchem a URL pública sem o protocolo (ex.:
// "meusite.com" em vez de "https://meusite.com"). Sem isso, os links de
// download de anexos/vouchers viram URLs relativas ao domínio errado (o do
// frontend) em vez de apontar para esta API.
function withProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export const env = {
  port: Number(process.env.PORT ?? 3333),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "12h",
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  uploadsDir: path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? "uploads"),
  uploadMaxBytes: Number(process.env.UPLOAD_MAX_BYTES ?? 15 * 1024 * 1024),
  publicUrl: withProtocol(process.env.PUBLIC_URL ?? "http://localhost:3333").replace(/\/$/, ""),
};
