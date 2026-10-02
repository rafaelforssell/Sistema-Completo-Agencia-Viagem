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

// Horário de voo: salvo como o horário local do aeroporto (em "UTC"), então
// é formatado em UTC pra mostrar exatamente o que está no bilhete.
export function formatHorarioVoo(value: string | undefined | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Espera entre a chegada de um voo e a partida do seguinte (conexão), em
// minutos. Os dois horários estão no mesmo "relógio" (hora local do
// aeroporto de conexão), então a diferença direta é a espera real.
// Aceita ISO ou o valor de um input datetime-local ("AAAA-MM-DDTHH:mm").
export function minutosDeConexao(chegada?: string | null, partida?: string | null): number | null {
  if (!chegada || !partida) return null;
  const inicio = Date.parse(`${chegada.slice(0, 16)}:00Z`);
  const fim = Date.parse(`${partida.slice(0, 16)}:00Z`);
  if (Number.isNaN(inicio) || Number.isNaN(fim)) return null;
  return Math.round((fim - inicio) / 60_000);
}

export function formatDuracao(minutos: number): string {
  const total = Math.abs(minutos);
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  if (horas === 0) return `${resto}min`;
  return resto === 0 ? `${horas}h` : `${horas}h${String(resto).padStart(2, "0")}`;
}
