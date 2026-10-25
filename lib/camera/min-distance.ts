export type Position = "REAR" | "TOP" | "SIDE";

/** Animal de referência: 450 kg. Valores a validar com zootecnista (plan.md, pergunta aberta 2). */
const REFERENCE = { weightKg: 450, lengthM: 2.4, heightM: 1.4, widthM: 0.7 };

/** Campo de visão horizontal padrão da câmera principal, no lado maior do quadro. */
export const DEFAULT_HFOV_DEG = 65;

/** Fração do quadro que o animal pode ocupar: 5% de margem em cada borda. */
const USABLE = 0.9;

function planeDims(position: Position, weightKg: number) {
  const k = Math.cbrt(weightKg / REFERENCE.weightKg);
  const length = REFERENCE.lengthM * k;
  const height = REFERENCE.heightM * k;
  const width = REFERENCE.widthM * k;
  if (position === "SIDE") return { across: length, up: height };
  if (position === "REAR") return { across: width, up: height };
  return { across: length, up: width };
}

export function minDistance(input: {
  position: Position;
  weightKg: number;
  frameWidth: number;
  frameHeight: number;
  hfovDeg?: number;
}): number {
  const { position, weightKg, frameWidth, frameHeight } = input;
  const tanLong = Math.tan(((input.hfovDeg ?? DEFAULT_HFOV_DEG) * Math.PI) / 360);
  const long = Math.max(frameWidth, frameHeight);
  const short = Math.min(frameWidth, frameHeight);
  const tanShort = tanLong * (short / long);
  const tanAcross = frameWidth >= frameHeight ? tanLong : tanShort;
  const tanUp = frameWidth >= frameHeight ? tanShort : tanLong;
  const { across, up } = planeDims(position, weightKg);
  return Math.max(across / (2 * tanAcross * USABLE), up / (2 * tanUp * USABLE));
}

/** Arredonda para cima na casa de 0,1 m. */
export function roundUpDistance(meters: number): number {
  return Math.ceil(meters * 10 - 1e-9) / 10;
}

export function formatDistance(meters: number): string {
  return `${roundUpDistance(meters).toFixed(1).replace(".", ",")} m`;
}
