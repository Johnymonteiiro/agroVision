import { describe, expect, it } from "vitest";
import { mainPhoto } from "@/lib/photos/main-photo";

const at = (iso: string) => new Date(iso);

describe("regra da foto principal", () => {
  it("regra da foto principal: a lateral mais recente vence fotos mais novas de outra posicao", () => {
    const photos = [
      { id: "side-old", position: "SIDE" as const, capturedAt: at("2026-10-01T10:00:00Z") },
      { id: "side-new", position: "SIDE" as const, capturedAt: at("2026-10-02T10:00:00Z") },
      { id: "rear-newest", position: "REAR" as const, capturedAt: at("2026-10-03T10:00:00Z") },
    ];
    expect(mainPhoto(photos)?.id).toBe("side-new");
  });

  it("regra da foto principal: sem lateral, a mais recente de outra posicao", () => {
    const photos = [
      { id: "top", position: "TOP" as const, capturedAt: at("2026-10-01T10:00:00Z") },
      { id: "rear", position: "REAR" as const, capturedAt: at("2026-10-02T10:00:00Z") },
    ];
    expect(mainPhoto(photos)?.id).toBe("rear");
  });

  it("regra da foto principal: sem foto, nenhuma", () => {
    expect(mainPhoto([])).toBeNull();
  });
});
