import { z } from "zod";

export const MESSAGES = {
  externalId: "Informe uma identificação de até 20 caracteres",
  category: "Escolha a categoria",
  sex: "Escolha o sexo",
  age: "Informe a idade",
  ageUnit: "Escolha meses ou anos",
  weightKg: "Confira o peso informado",
  duplicate: "Já existe um animal com este ID.",
} as const;

const fields = {
  externalId: z.string().trim().min(1, { error: MESSAGES.externalId }).max(20, { error: MESSAGES.externalId }),
  category: z.enum(["TAURINE", "ZEBU"], { error: MESSAGES.category }),
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
  const fieldErrors = z.flattenError(result.error).fieldErrors as Record<string, string[] | undefined>;
  const errors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages?.length) errors[key] = messages[0];
  }
  return { success: false as const, fields: errors };
}

/** Valida um campo isolado (usado ao sair do campo). Devolve a mensagem ou null. */
export function validateField(field: AnimalField, value: unknown): string | null {
  const result = fields[field].safeParse(value);
  return result.success ? null : result.error.issues[0]?.message ?? MESSAGES[field];
}
