import { describe, expect, it } from "vitest";
import { validateCategoryField, validateNewCategory } from "@/modules/categories/validation";

const valid = { id: "8f6a2c1e-2b1d-4c3a-9e5f-0a1b2c3d4e5f", name: "Nelore", description: null };

describe("limites do nome", () => {
  it.each(["", "   ", "x".repeat(31)])("limites do nome: '%s' e rejeitado", (name) => {
    expect(validateCategoryField("name", name)).toBe("Informe um nome de até 30 caracteres");
    expect(validateNewCategory({ ...valid, name }).success).toBe(false);
  });

  it.each(["N", "x".repeat(30), "  Nelore  "])("limites do nome: '%s' e aceito", (name) => {
    expect(validateCategoryField("name", name)).toBeNull();
    const result = validateNewCategory({ ...valid, name });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe(name.trim());
  });
});

describe("limites da descricao", () => {
  it("limites da descricao: 41 caracteres e rejeitada", () => {
    const description = "d".repeat(41);
    expect(validateCategoryField("description", description)).toBe("A descrição tem no máximo 40 caracteres");
    expect(validateNewCategory({ ...valid, description }).success).toBe(false);
  });

  it.each(["d".repeat(40), "", null])("limites da descricao: %j e aceita", (description) => {
    expect(validateCategoryField("description", description)).toBeNull();
    expect(validateNewCategory({ ...valid, description }).success).toBe(true);
  });
});
