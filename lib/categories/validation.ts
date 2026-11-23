import { z } from "zod";
import { firstErrors } from "@/lib/animals/validation";

export const CATEGORY_MESSAGES = {
  name: "Informe um nome de até 30 caracteres",
  description: "A descrição tem no máximo 40 caracteres",
  duplicate: "Já existe uma categoria com este nome.",
} as const;

const fields = {
  name: z.string({ error: CATEGORY_MESSAGES.name }).trim().min(1, { error: CATEGORY_MESSAGES.name }).max(30, { error: CATEGORY_MESSAGES.name }),
  // Vazia ou só espaços vira null: a categoria fica sem legenda.
  description: z
    .string({ error: CATEGORY_MESSAGES.description })
    .trim()
    .max(40, { error: CATEGORY_MESSAGES.description })
    .transform((d) => (d === "" ? null : d))
    .nullish(),
};

export const newCategorySchema = z.object({
  id: z.uuid({ error: "id inválido" }),
  ...fields,
});

export type NewCategory = z.infer<typeof newCategorySchema>;
export type CategoryField = keyof typeof fields;

export function validateNewCategory(input: unknown) {
  const result = newCategorySchema.safeParse(input);
  if (result.success) return { success: true as const, data: result.data };
  return { success: false as const, fields: firstErrors(result.error) };
}

export function validateCategoryField(field: CategoryField, value: unknown): string | null {
  const result = fields[field].safeParse(value);
  return result.success ? null : result.error.issues[0]?.message ?? CATEGORY_MESSAGES[field];
}
