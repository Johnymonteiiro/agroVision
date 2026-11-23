import type { Framing } from "@/modules/vision/detection/framing";
import { DEFAULT_HFOV_DEG, minDistance, roundUpDistance } from "@/modules/vision/geometry/min-distance";
import type { Position } from "@/modules/vision/positions";
import type { QualityMetrics } from "@/modules/vision/quality/metrics";

export type PhotoToSend = {
  imageId: string;
  blob: Blob;
  position: Position;
  framing: Framing;
  capturedAt: string;
  width: number;
  height: number;
  // Medida na revisão (qualidade-imagem). undefined = ainda medindo; null = não foi possível medir.
  quality?: QualityMetrics | null;
};

// Envia a foto para POST /api/animals/{id}/images. O imageId vem do cliente, então reenviar não duplica.
// A distância mínima gravada é a recomendada para o peso do animal e o formato da foto.
export async function sendPhoto(animalId: string, weightKg: number, photo: PhotoToSend) {
  const distance = minDistance({
    position: photo.position,
    weightKg,
    frameWidth: photo.width,
    frameHeight: photo.height,
    hfovDeg: DEFAULT_HFOV_DEG,
  });
  const form = new FormData();
  form.set("file", photo.blob, "foto.jpg");
  form.set("imageId", photo.imageId);
  form.set("position", photo.position);
  form.set("framing", photo.framing);
  form.set("minDistanceM", String(roundUpDistance(distance)));
  form.set("capturedAt", photo.capturedAt);
  // Sem medida, as colunas ficam null; sem detector, só a contagem fica null.
  if (photo.quality) {
    form.set("brightness", String(photo.quality.brightness));
    form.set("sharpness", String(photo.quality.sharpness));
    if (photo.quality.animalCount !== null) form.set("animalCount", String(photo.quality.animalCount));
  }
  const res = await fetch(`/api/animals/${animalId}/images`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`upload ${res.status}`);
}
