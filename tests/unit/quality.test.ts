import { describe, expect, it } from "vitest";
import { countAnimals, type FrameDetection } from "@/modules/vision/detection/framing";
import { qualityIssues } from "@/modules/vision/quality/issues";
import { measureQuality, reducedSize, type QualityMetrics } from "@/modules/vision/quality/metrics";

// Imagem RGBA (como ImageData.data) com a cor de cada pixel dada por `pixel(x, y)`.
function image(width: number, height: number, pixel: (x: number, y: number) => [number, number, number]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y);
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return data;
}

const solid = (rgb: [number, number, number]) => image(64, 64, () => rgb);

describe("metricas de qualidade", () => {
  it("brilho pela luma", () => {
    expect(measureQuality(solid([0, 0, 0]), 64, 64).brightness).toBe(0);
    expect(measureQuality(solid([255, 255, 255]), 64, 64).brightness).toBeCloseTo(255, 6);
    expect(measureQuality(solid([128, 128, 128]), 64, 64).brightness).toBeCloseTo(128, 6);
    expect(measureQuality(solid([255, 0, 0]), 64, 64).brightness).toBeCloseTo(76.2, 1);
  });

  it("nitidez pelo laplaciano", () => {
    expect(measureQuality(solid([90, 90, 90]), 64, 64).sharpness).toBe(0);
    const checker = image(64, 64, (x, y) => ((x + y) % 2 === 0 ? [0, 0, 0] : [255, 255, 255]));
    expect(measureQuality(checker, 64, 64).sharpness).toBeGreaterThan(1000);
  });

  it("reducao por blocos", () => {
    expect(reducedSize(1024, 768)).toEqual({ width: 512, height: 384 });
    expect(reducedSize(1920, 1440)).toEqual({ width: 480, height: 360 });
    expect(reducedSize(300, 200)).toEqual({ width: 300, height: 200 });
    // A mesma cena (gradiente horizontal) em dois tamanhos dá o mesmo brilho, com diferença de até 1.
    const gradient = (w: number) => (x: number): [number, number, number] => {
      const v = Math.floor((x / w) * 255);
      return [v, v, v];
    };
    const big = measureQuality(image(1024, 768, gradient(1024)), 1024, 768).brightness;
    const small = measureQuality(image(512, 384, gradient(512)), 512, 384).brightness;
    expect(Math.abs(big - small)).toBeLessThanOrEqual(1);
  });

  it("conta so bovino com score", () => {
    const d = (categoryName: string, score: number): FrameDetection => ({
      categoryName,
      score,
      box: { x: 0, y: 0, width: 10, height: 10 },
    });
    expect(countAnimals([d("cow", 0.8), d("cow", 0.5), d("cow", 0.4), d("horse", 0.9)])).toBe(2);
    expect(countAnimals([])).toBe(0);
  });

  it("problemas pelos limites", () => {
    const ok: QualityMetrics = { brightness: 150, sharpness: 500, animalCount: 1 };
    const cases: Array<[Partial<QualityMetrics>, string[]]> = [
      [{ animalCount: 0 }, ["NO_ANIMAL"]],
      [{ animalCount: 1 }, []],
      [{ animalCount: 2 }, ["MULTIPLE_ANIMALS"]],
      [{ animalCount: null }, []],
      [{ sharpness: 49.9 }, ["BLURRY"]],
      [{ sharpness: 50 }, []],
      [{ brightness: 59.9 }, ["TOO_DARK"]],
      [{ brightness: 60 }, []],
      [{ brightness: 220 }, []],
      [{ brightness: 220.1 }, ["TOO_BRIGHT"]],
      [{ animalCount: 0, sharpness: 10, brightness: 20 }, ["NO_ANIMAL", "BLURRY", "TOO_DARK"]],
    ];
    for (const [input, expected] of cases) {
      expect(qualityIssues({ ...ok, ...input }), JSON.stringify(input)).toEqual(expected);
    }
  });
});
