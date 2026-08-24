export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Datas "puras" (nascimento, validade de passaporte, ida/volta, vencimento...)
// são armazenadas como meia-noite UTC representando um dia de calendário —
// não um instante real no tempo. Formatar em UTC evita que o fuso horário do
// navegador jogue a data exibida um dia para trás (ex.: meia-noite UTC de
// 24/08 vira 23/08 21h no horário de Brasília).
export function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date);
}

export function formatDateTime(value: string | undefined | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function daysUntil(value: string | undefined | null): number | null {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;
  // O valor alvo é uma data de calendário armazenada em UTC — lemos o dia
  // pelos getters UTC. "Hoje" é o dia de calendário local de quem está
  // olhando a tela, então usamos os getters locais para o momento atual.
  const targetUTC = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  const now = new Date();
  const todayLocal = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((targetUTC - todayLocal) / (1000 * 60 * 60 * 24));
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
