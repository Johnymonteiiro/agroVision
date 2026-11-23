// Posições de foto do dataset: o ângulo da câmera em relação ao animal. A câmera guiada, a distância
// mínima e o rótulo do dataset dependem delas (o valor é gravado em `animal_images.position`).
export type Position = "REAR" | "TOP" | "SIDE";

export const POSITION_LABEL = { REAR: "De trás", TOP: "De cima", SIDE: "Lateral" } as const;
export const POSITION_ORDER = ["SIDE", "REAR", "TOP"] as const;

// Escolha da posição antes da foto, na tela "Qual posição?" e no cadastro.
export const POSITION_OPTIONS = [
  { position: "REAR", icon: "u_turn_left", hint: "Traseira do animal, centralizada" },
  { position: "TOP", icon: "vertical_align_bottom", hint: "Dorso visto de cima" },
  { position: "SIDE", icon: "swap_horiz", hint: "Corpo inteiro, de lado" },
] as const;

export const POSITION_SLUG = { REAR: "de-tras", TOP: "de-cima", SIDE: "lateral" } as const;
export function positionFromSlug(slug: string) {
  const entry = Object.entries(POSITION_SLUG).find(([, s]) => s === slug);
  return (entry?.[0] as keyof typeof POSITION_SLUG | undefined) ?? null;
}
