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
