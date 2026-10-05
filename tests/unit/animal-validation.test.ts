import { describe, expect, it } from "vitest";
import { validateField, validateNewAnimal } from "@/lib/animals/validation";

const valid = {
  id: "8f6a2c1e-2b1d-4c3a-9e5f-0a1b2c3d4e5f",
  externalId: "023",
  category: "TAURINE",
  sex: "MALE",
  age: 24,
  ageUnit: "MONTHS",
  weightKg: 485,
};

describe("limites de peso", () => {
  it.each([29, 1501, 450.5])("limites de peso: %s e rejeitado", (weightKg) => {
    expect(validateField("weightKg", weightKg)).toBe("Confira o peso informado");
    const result = validateNewAnimal({ ...valid, weightKg });
    expect(result.success).toBe(false);
  });

  it.each([30, 1500])("limites de peso: %s e aceito", (weightKg) => {
    expect(validateField("weightKg", weightKg)).toBeNull();
    expect(validateNewAnimal({ ...valid, weightKg }).success).toBe(true);
  });
});

describe("limites da identificacao", () => {
  it.each(["", "x".repeat(21)])("limites da identificacao: '%s' e rejeitada", (externalId) => {
    expect(validateField("externalId", externalId)).toBe(
      "Informe uma identificação de até 20 caracteres",
    );
    expect(validateNewAnimal({ ...valid, externalId }).success).toBe(false);
  });

  it.each(["1", "x".repeat(20)])("limites da identificacao: '%s' e aceita", (externalId) => {
    expect(validateField("externalId", externalId)).toBeNull();
    expect(validateNewAnimal({ ...valid, externalId }).success).toBe(true);
  });
});
