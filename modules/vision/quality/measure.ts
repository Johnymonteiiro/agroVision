"use client";

import { useEffect, useState } from "react";
import { loadImageDetector } from "@/modules/vision/detection/detector";
import { countAnimals } from "@/modules/vision/detection/framing";
import { measureQuality, type QualityMetrics } from "./metrics";

/** Mede o quadro da câmera já desenhado no canvas; a contagem vem da última detecção ao vivo. */
export function measureCanvas(canvas: HTMLCanvasElement, animalCount: number | null): QualityMetrics | null {
  const ctx = canvas.getContext("2d");
  if (!ctx || !canvas.width || !canvas.height) return null;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { ...measureQuality(data, canvas.width, canvas.height), animalCount };
}

/** Mede uma foto da galeria: pixels e bovinos pelo detector em modo imagem. null se não decodifica. */
export async function measureFile(file: Blob): Promise<QualityMetrics | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return null;
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { brightness, sharpness } = measureQuality(data, canvas.width, canvas.height);
    let animalCount: number | null = null;
    try {
      const detector = await loadImageDetector();
      animalCount = countAnimals(detector.detectImage(bitmap));
    } catch (error) {
      console.error("detector de imagem indisponível", error);
    }
    return { brightness, sharpness, animalCount };
  } finally {
    bitmap.close();
  }
}

export type FileQuality = { checking: true } | { checking: false; metrics: QualityMetrics | null };

/** Qualidade de um arquivo, medida em segundo plano; `checking` enquanto a medição desta foto não volta. */
export function useFileQuality(file: Blob): FileQuality {
  const [done, setDone] = useState<{ file: Blob; metrics: QualityMetrics | null } | null>(null);
  useEffect(() => {
    let cancelled = false;
    void measureFile(file).then((metrics) => {
      if (!cancelled) setDone({ file, metrics });
    });
    return () => {
      cancelled = true;
    };
  }, [file]);
  return done?.file === file ? { checking: false, metrics: done.metrics } : { checking: true };
}
