import { describe, expect, it } from "vitest";
import { safeOrigin } from "@/lib/evaluation/origin";

describe("origem do cancelar", () => {
  it.each([
    ["//evil.com", "/"],
    ["/\\evil.com", "/"],
    ["https://evil.com", "/"],
    [undefined, "/"],
    [["/animais", "/"], "/"],
    ["/animais", "/animais"],
  ])("safeOrigin(%j) -> %s", (de, expected) => {
    expect(safeOrigin(de)).toBe(expected);
  });
});

describe("destino da tela de rotulo", () => {
  const profile = "/animais/8f6a2c1e-2b1d-4c3a-9e5f-0a1b2c3d4e5f";
  it.each([
    ["//evil.com", profile],
    ["/\\evil.com", profile],
    ["https://evil.com", profile],
    [undefined, profile],
    [[`${profile}/fotos`, profile], profile],
    [`${profile}/fotos`, `${profile}/fotos`],
  ])("destino do rotulo cai no perfil: %j -> %s", (de, expected) => {
    expect(safeOrigin(de, profile)).toBe(expected);
  });
});
