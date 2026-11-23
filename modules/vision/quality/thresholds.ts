// Limites PROVISÓRIOS (qualidade-imagem, pergunta aberta 1). Medidos na foto de referência dos
// testes: a nítida dá ~2000 de nitidez e 182 a 191 de brilho; borrada, 7,5; escurecida, 36.
// Recalibrar com fotos do campo: os números brutos ficam gravados em `animal_images`.
export const QUALITY_THRESHOLDS = {
  /** Abaixo disso, "Foto desfocada". */
  minSharpness: 50,
  /** Abaixo disso, "Foto muito escura". */
  minBrightness: 60,
  /** Acima disso, "Foto muito clara". */
  maxBrightness: 220,
} as const;
