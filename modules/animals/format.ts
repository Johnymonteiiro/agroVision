import { ageInMonths, formatAge, formatAgeShort } from "@/modules/animals/age";

export const SEX_LABEL = { MALE: "Macho", FEMALE: "Fêmea" } as const;
export const READINESS_LABEL = { READY: "Pronto", NOT_READY: "Não pronto" } as const;
type AnimalLike = {
  externalId: string;
  categoryName: string;
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
    line1: `${animal.categoryName} • ${SEX_LABEL[animal.sex]}`,
    line2: `${formatAge(months)} • ${animal.weightKg} kg`,
    ageShort: formatAgeShort(months),
  };
}

export function animalCountLabel(n: number) {
  return n === 1 ? "1 animal" : `${n} animais`;
}
