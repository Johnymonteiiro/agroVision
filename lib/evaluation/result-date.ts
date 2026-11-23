const FORMAT = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// "25 out 2026, 09:42", como no design 1f; o pt-BR do Intl escreveria "25 de out. de 2026, 09:42".
export function formatResultDate(date: Date) {
  const part = Object.fromEntries(FORMAT.formatToParts(date).map((p) => [p.type, p.value]));
  return `${part.day} ${part.month.replace(".", "")} ${part.year}, ${part.hour}:${part.minute}`;
}
