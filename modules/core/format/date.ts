const TIME_ZONE = "America/Sao_Paulo";

/** "Hoje, 09:42", "Ontem, 18:10" ou "28/08, 10:16". */
export function formatWhen(date: Date, now: Date = new Date()) {
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(d);
  const time = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" }).format(date);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (day(date) === day(now)) return `Hoje, ${time}`;
  if (day(date) === day(yesterday)) return `Ontem, ${time}`;
  const dm = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, day: "2-digit", month: "2-digit" }).format(date);
  return `${dm}, ${time}`;
}
