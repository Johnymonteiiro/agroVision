export type Framing = "FRAMED" | "OUT_OF_FRAME" | "TOO_FAR" | "NOT_DETECTED" | "UNAVAILABLE";

export type FrameDetection = {
  categoryName: string;
  score: number;
  box: { x: number; y: number; width: number; height: number };
};

const MIN_SCORE = 0.5;
const MARGIN = 0.05;
const MIN_COVERAGE = 0.5;

export function classifyFraming(detections: FrameDetection[], frameWidth: number, frameHeight: number): Framing {
  const cow = detections
    .filter((d) => d.categoryName === "cow" && d.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)[0];
  if (!cow) return "NOT_DETECTED";

  const { x, y, width, height } = cow.box;
  const left = x / frameWidth;
  const top = y / frameHeight;
  const right = (x + width) / frameWidth;
  const bottom = (y + height) / frameHeight;
  if (left < MARGIN || top < MARGIN || right > 1 - MARGIN || bottom > 1 - MARGIN) return "OUT_OF_FRAME";

  if (width / frameWidth < MIN_COVERAGE && height / frameHeight < MIN_COVERAGE) return "TOO_FAR";
  return "FRAMED";
}

export const FRAMING_UI: Record<Framing, { label: string; color: string }> = {
  FRAMED: { label: "Enquadrado", color: "#7FD1A3" },
  OUT_OF_FRAME: { label: "Afaste-se — o animal não cabe no quadro", color: "#E8A93A" },
  TOO_FAR: { label: "Aproxime-se", color: "#E8A93A" },
  NOT_DETECTED: { label: "Animal não detectado", color: "#FFFFFF" },
  UNAVAILABLE: { label: "Guia de enquadramento indisponível", color: "#FFFFFF" },
};
