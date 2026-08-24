export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function diffInDays(a: Date, b: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / MS_PER_DAY);
}

/** Próxima ocorrência do mês/dia de `date` a partir de `from` (ano ajustado). */
export function nextAnniversary(date: Date, from: Date): Date {
  const year = from.getFullYear();
  let next = new Date(year, date.getMonth(), date.getDate());
  if (startOfDay(next) < startOfDay(from)) {
    next = new Date(year + 1, date.getMonth(), date.getDate());
  }
  return next;
}
