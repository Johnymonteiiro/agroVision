// Métricas de qualidade de uma foto (qualidade-imagem, door 2). Os números ficam gravados em
// `animal_images`, então a definição não muda sem migrar o significado das fotos já coletadas.

export type QualityMetrics = {
  /** Média da luma Rec.601, de 0 a 255. */
  brightness: number;
  /** Variância do Laplaciano de 4 vizinhos em tons de cinza; 0 numa imagem lisa. */
  sharpness: number;
  /** Bovinos detectados (`countAnimals`); null quando o detector não está disponível. */
  animalCount: number | null;
};

const MAX_SIDE = 512;

/** Fator k da redução por blocos k × k: no máximo 512 px no lado maior. */
export function reductionFactor(width: number, height: number): number {
  return Math.max(1, Math.ceil(Math.max(width, height) / MAX_SIDE));
}

export function reducedSize(width: number, height: number) {
  const k = reductionFactor(width, height);
  return { width: Math.floor(width / k), height: Math.floor(height / k) };
}

/**
 * Brilho e nitidez de uma imagem RGBA (como `ImageData.data`). Reduz por média de blocos em
 * JavaScript, sem o redimensionamento do canvas, para o mesmo arquivo dar o mesmo número em
 * qualquer navegador.
 */
export function measureQuality(rgba: Uint8ClampedArray, width: number, height: number) {
  const k = reductionFactor(width, height);
  const { width: w, height: h } = reducedSize(width, height);
  const luma = new Float64Array(w * h);
  const area = k * k;

  for (let by = 0; by < h; by++) {
    for (let bx = 0; bx < w; bx++) {
      let sum = 0;
      for (let dy = 0; dy < k; dy++) {
        let i = ((by * k + dy) * width + bx * k) * 4;
        for (let dx = 0; dx < k; dx++, i += 4) {
          sum += 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
        }
      }
      luma[by * w + bx] = sum / area;
    }
  }

  let total = 0;
  for (let i = 0; i < luma.length; i++) total += luma[i];
  const brightness = luma.length ? total / luma.length : 0;

  // Laplaciano de 4 vizinhos no interior (sem as bordas) e a variância populacional dele.
  let n = 0;
  let mean = 0;
  let m2 = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap = luma[i - 1] + luma[i + 1] + luma[i - w] + luma[i + w] - 4 * luma[i];
      n++;
      const delta = lap - mean;
      mean += delta / n;
      m2 += delta * (lap - mean);
    }
  }
  const sharpness = n ? m2 / n : 0;

  return { brightness, sharpness };
}
