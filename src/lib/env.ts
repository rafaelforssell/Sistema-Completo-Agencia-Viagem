// Variáveis de ambiente usadas pelo servidor (route handlers / middleware).
// Ver .env.example para a lista completa.

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

export const env = {
  apiBaseUrl: required("API_BASE_URL", "http://localhost:3333/api"),
  authCookieName: process.env.AUTH_COOKIE_NAME ?? "sav_token",
};
