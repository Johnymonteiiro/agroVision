import { describe, expect, it } from "vitest";
import { classifyFraming, type FrameDetection } from "@/lib/camera/framing";

const W = 1000;
const H = 750;

function cow(x0: number, y0: number, x1: number, y1: number, score = 0.8): FrameDetection {
  return {
    categoryName: "cow",
    score,
    box: { x: x0 * W, y: y0 * H, width: (x1 - x0) * W, height: (y1 - y0) * H },
  };
}

describe("classificacao do enquadramento", () => {
  it("enquadrado: caixa de 10%,20% a 90%,80% com score 0,8", () => {
    expect(classifyFraming([cow(0.1, 0.2, 0.9, 0.8)], W, H)).toBe("FRAMED");
  });

  it("fora do quadro: caixa invade a margem de 5% da esquerda", () => {
    expect(classifyFraming([cow(0.02, 0.2, 0.9, 0.8)], W, H)).toBe("OUT_OF_FRAME");
  });

  it("fora do quadro: caixa invade a margem de 5% de baixo", () => {
    expect(classifyFraming([cow(0.1, 0.2, 0.9, 0.97)], W, H)).toBe("OUT_OF_FRAME");
  });

  it("longe demais: caixa de 30% a 70% nos dois eixos", () => {
    expect(classifyFraming([cow(0.3, 0.3, 0.7, 0.7)], W, H)).toBe("TOO_FAR");
  });

  it("nao detectado: nenhuma caixa", () => {
    expect(classifyFraming([], W, H)).toBe("NOT_DETECTED");
  });

  it("nao detectado: vaca com score 0,49", () => {
    expect(classifyFraming([cow(0.1, 0.2, 0.9, 0.8, 0.49)], W, H)).toBe("NOT_DETECTED");
  });

  it("nao detectado: so ha outra classe", () => {
    const horse = { ...cow(0.1, 0.2, 0.9, 0.8), categoryName: "horse" };
    expect(classifyFraming([horse], W, H)).toBe("NOT_DETECTED");
  });
});
