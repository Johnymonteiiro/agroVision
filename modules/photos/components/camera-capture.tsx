"use client";

import { useState } from "react";
import { GuidedCamera, type CapturedPhoto } from "@/modules/vision/camera/guided-camera";
import type { Position } from "@/modules/vision/positions";
import { sendPhoto } from "@/modules/photos/send-photo";

type Props = { animalId: string; weightKg: number; position: Position; initialCount: number };

// Câmera do perfil: cada "Usar foto" envia na hora e a câmera fica aberta para a próxima foto.
export function CameraCapture({ animalId, weightKg, position, initialCount }: Props) {
  const [count, setCount] = useState(initialCount);

  async function upload(photo: CapturedPhoto) {
    await sendPhoto(animalId, weightKg, { ...photo, imageId: crypto.randomUUID(), position });
    setCount((n) => n + 1);
  }

  return (
    <GuidedCamera
      position={position}
      weightKg={weightKg}
      cancel={{ href: `/animais/${animalId}` }}
      counter={count}
      needsNetwork
      onUse={upload}
    />
  );
}
