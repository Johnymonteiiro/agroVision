import { ageInMonths, formatAge, formatAgeShort } from "./age";

export const CATEGORY_LABEL = { TAURINE: "Taurino", ZEBU: "Zebu" } as const;
export const SEX_LABEL = { MALE: "Macho", FEMALE: "Fêmea" } as const;
export const POSITION_LABEL = { REAR: "De trás", TOP: "De cima", SIDE: "Lateral" } as const;
export const POSITION_ORDER = ["SIDE", "REAR", "TOP"] as const;

export const POSITION_SLUG = { REAR: "de-tras", TOP: "de-cima", SIDE: "lateral" } as const;
export function positionFromSlug(slug: string) {
  const entry = Object.entries(POSITION_SLUG).find(([, s]) => s === slug);
  return (entry?.[0] as keyof typeof POSITION_SLUG | undefined) ?? null;
}

type AnimalLike = {
  externalId: string;
  category: keyof typeof CATEGORY_LABEL;
  sex: keyof typeof SEX_LABEL;
  birthDateEstimated: string;
  weightKg: number;
};

export function animalTitle(externalId: string) {
  return `Animal #${externalId}`;
}

/** Resumo padrão (PRD §10): "Taurino • Macho" / "24 meses • 485 kg". */
export function animalSummary(animal: AnimalLike, now: Date = new Date()) {
  const months = ageInMonths(animal.birthDateEstimated, now);
  return {
    title: animalTitle(animal.externalId),
    line1: `${CATEGORY_LABEL[animal.category]} • ${SEX_LABEL[animal.sex]}`,
    line2: `${formatAge(months)} • ${animal.weightKg} kg`,
    ageShort: formatAgeShort(months),
  };
}

export function photoCountLabel(n: number) {
  return n === 1 ? "1 foto" : `${n} fotos`;
}

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
