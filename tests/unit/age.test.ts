import { describe, expect, it } from "vitest";
import { ageConversion, ageInMonths, birthDateFromAge, formatAge } from "@/lib/animals/age";

const today = new Date("2026-10-04T12:00:00-03:00");

describe("data de nascimento estimada", () => {
  it("data de nascimento estimada: 24 meses e 2 anos em 2026-10-04 dao 2024-10-04", () => {
    expect(birthDateFromAge(24, "MONTHS", today)).toBe("2024-10-04");
    expect(birthDateFromAge(2, "YEARS", today)).toBe("2024-10-04");
  });

  it("a idade volta a ser calculada a partir da data", () => {
    expect(ageInMonths("2024-10-04", today)).toBe(24);
    expect(ageInMonths("2024-10-04", new Date("2027-04-04T12:00:00-03:00"))).toBe(30);
  });
});

describe("idade exibida", () => {
  it.each([
    [24, "24 meses"],
    [35, "35 meses"],
    [36, "3 anos"],
  ])("idade exibida: %i meses -> %s", (months, label) => {
    expect(formatAge(months)).toBe(label);
  });
});

describe("conversao da idade", () => {
  it("24 meses mostra = 2 anos", () => {
    expect(ageConversion(24, "MONTHS")).toBe("= 2 anos");
  });
});
