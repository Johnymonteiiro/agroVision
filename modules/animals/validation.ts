import { z } from "zod";
import { firstErrors } from "@/modules/core/validation/errors";

export const MESSAGES = {
  externalId: "Informe uma identificação de até 20 caracteres",
  categoryId: "Escolha a categoria",
  readiness: "Escolha o rótulo",
  sex: "Escolha o sexo",
  age: "Informe a idade",
  ageUnit: "Escolha meses ou anos",
  weightKg: "Confira o peso informado",
  duplicate: "Já existe um animal com este ID.",
} as const;

export const READINESS_VALUES = ["READY", "NOT_READY"] as const;

const fields = {
  externalId: z.string().trim().min(1, { error: MESSAGES.externalId }).max(20, { error: MESSAGES.externalId }),
  // A existência da categoria só o banco decide (chave estrangeira); aqui, só o formato.
  categoryId: z.uuid({ error: MESSAGES.categoryId }),
  readiness: z.enum(READINESS_VALUES, { error: MESSAGES.readiness }),
  sex: z.enum(["MALE", "FEMALE"], { error: MESSAGES.sex }),
  age: z.int({ error: MESSAGES.age }).min(0, { error: MESSAGES.age }),
  ageUnit: z.enum(["MONTHS", "YEARS"], { error: MESSAGES.ageUnit }),
  weightKg: z
    .int({ error: MESSAGES.weightKg })
    .min(30, { error: MESSAGES.weightKg })
    .max(1500, { error: MESSAGES.weightKg }),
};

export const newAnimalSchema = z.object({
  id: z.uuid({ error: "id inválido" }),
  ...fields,
});

export type NewAnimal = z.infer<typeof newAnimalSchema>;
export type AnimalField = keyof typeof fields;

export function validateNewAnimal(input: unknown) {
  const result = newAnimalSchema.safeParse(input);
  if (result.success) return { success: true as const, data: result.data };
  return { success: false as const, fields: firstErrors(result.error) };
}

/** Valida um campo isolado (usado ao sair do campo). Devolve a mensagem ou null. */
export function validateField(field: AnimalField, value: unknown): string | null {
  const result = fields[field].safeParse(value);
  return result.success ? null : result.error.issues[0]?.message ?? MESSAGES[field];
}

export const readinessChangeSchema = z.object({
  readiness: z.enum(READINESS_VALUES, { error: MESSAGES.readiness }),
  scope: z.enum(["FROM_NOW", "FIX_ALL_PHOTOS"], { error: "Escolha o motivo" }),
});

export type ReadinessChange = z.infer<typeof readinessChangeSchema>;
