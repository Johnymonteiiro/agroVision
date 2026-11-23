import { z } from "zod";

/** Primeira mensagem de cada campo de um erro do zod, no formato `{ campo: mensagem }` das APIs. */
export function firstErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const errors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages?.length) errors[key] = messages[0];
  }
  return errors;
}
