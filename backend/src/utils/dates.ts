// Datas "puras" de calendário (nascimento, validade de passaporte, ida/volta
// de viagem...) são armazenadas como meia-noite UTC representando um dia,
// não um instante real. Todas as funções abaixo trabalham em UTC de
// propósito — usar getters/setters locais faria o resultado depender do
// fuso horário configurado no servidor onde o processo Node roda, jogando a
// data um dia para trás ou para frente dependendo de onde a API está
// hospedada.

export function startOfDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function diffInDays(a: Date, b: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / MS_PER_DAY);
}

/** Próxima ocorrência do mês/dia de `date` a partir de `from` (ano ajustado). */
export function nextAnniversary(date: Date, from: Date): Date {
  const year = from.getUTCFullYear();
  let next = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate()));
  if (next < startOfDay(from)) {
    next = new Date(Date.UTC(year + 1, date.getUTCMonth(), date.getUTCDate()));
  }
  return next;
}

// "Hoje" do ponto de vista da agência (horário de Brasília), como meia-noite
// UTC — o mesmo formato das datas de calendário salvas no banco. Sem isso,
// a partir das 21h o servidor (em UTC) já consideraria o dia seguinte.
export function hojeCalendario(timeZone = "America/Sao_Paulo"): Date {
  const [ano, mes, dia] = new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date()).split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}
