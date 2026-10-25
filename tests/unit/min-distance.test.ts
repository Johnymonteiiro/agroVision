import { describe, expect, it } from "vitest";
import { formatDistance, minDistance } from "@/lib/camera/min-distance";

const landscape = { frameWidth: 640, frameHeight: 480 };
const portrait = { frameWidth: 480, frameHeight: 640 };

describe("formato da distancia", () => {
  it.each([
    [2.093, "2,1 m"],
    [2.0, "2,0 m"],
    [2.01, "2,1 m"],
  ])("formato da distancia: %s -> %s", (meters, label) => {
    expect(formatDistance(meters)).toBe(label);
  });
});

describe("tres posicoes nas duas orientacoes", () => {
  it.each([
    ["SIDE", landscape, "2,1 m"],
    ["SIDE", portrait, "2,8 m"],
    ["REAR", landscape, "1,7 m"],
    ["REAR", portrait, "1,3 m"],
    ["TOP", landscape, "2,1 m"],
    ["TOP", portrait, "2,8 m"],
  ] as const)("tres posicoes nas duas orientacoes: %s %o -> %s", (position, frame, label) => {
    const d = minDistance({ position, weightKg: 450, hfovDeg: 65, ...frame });
    expect(formatDistance(d)).toBe(label);
  });
});

describe("escala pelo peso", () => {
  it("escala pelo peso: 225 kg na lateral horizontal da 1,7 m", () => {
    const d = minDistance({ position: "SIDE", weightKg: 225, hfovDeg: 65, ...landscape });
    expect(formatDistance(d)).toBe("1,7 m");
  });
});

describe("lateral 450 kg", () => {
  it("lateral 450 kg horizontal: 2,1 m", () => {
    const d = minDistance({ position: "SIDE", weightKg: 450, hfovDeg: 65, ...landscape });
    expect(formatDistance(d)).toBe("2,1 m");
  });

  it("lateral 450 kg vertical: 2,8 m", () => {
    const d = minDistance({ position: "SIDE", weightKg: 450, hfovDeg: 65, ...portrait });
    expect(formatDistance(d)).toBe("2,8 m");
  });
});
