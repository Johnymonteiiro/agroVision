export type AgeUnit = "MONTHS" | "YEARS";

const TIME_ZONE = "America/Sao_Paulo";

/** Data de hoje (YYYY-MM-DD) no fuso da fazenda. */
export function todayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

function parseIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

function daysInMonth(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function toMonths(age: number, unit: AgeUnit) {
  return unit === "YEARS" ? age * 12 : age;
}

/** birthDateEstimated = data do cadastro − idade (PRD §10). */
export function birthDateFromAge(age: number, unit: AgeUnit, now: Date = new Date()): string {
  const { y, m, d } = parseIso(todayIso(now));
  const total = y * 12 + (m - 1) - toMonths(age, unit);
  const by = Math.floor(total / 12);
  const bm = (total % 12) + 1;
  const bd = Math.min(d, daysInMonth(by, bm));
  return `${by}-${String(bm).padStart(2, "0")}-${String(bd).padStart(2, "0")}`;
}

export function ageInMonths(birthDate: string, now: Date = new Date()): number {
  const b = parseIso(birthDate);
  const t = parseIso(todayIso(now));
  let months = (t.y - b.y) * 12 + (t.m - b.m);
  if (t.d < b.d) months -= 1;
  return Math.max(0, months);
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Até 35 meses em meses; a partir de 36 em anos (PRD §10). */
export function formatAge(months: number): string {
  if (months < 36) return plural(months, "mês", "meses");
  return plural(Math.floor(months / 12), "ano", "anos");
}

/** Forma curta da grade do perfil: "24 m", "3 anos". */
export function formatAgeShort(months: number): string {
  return months < 36 ? `${months} m` : formatAge(months);
}

/** Texto abaixo do campo de idade: "= 2 anos", "= 1 ano e 6 meses", "= 24 meses". */
export function ageConversion(age: number, unit: AgeUnit): string {
  if (unit === "YEARS") return `= ${plural(age * 12, "mês", "meses")}`;
  const years = Math.floor(age / 12);
  const months = age % 12;
  if (years === 0) return `= ${plural(months, "mês", "meses")}`;
  if (months === 0) return `= ${plural(years, "ano", "anos")}`;
  return `= ${plural(years, "ano", "anos")} e ${plural(months, "mês", "meses")}`;
}
