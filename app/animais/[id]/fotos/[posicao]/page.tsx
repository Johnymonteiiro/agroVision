import { notFound } from "next/navigation";
import { z } from "zod";
import { positionFromSlug } from "@/lib/animals/format";
import { findAnimal, listImages } from "@/lib/animals/repo";
import { CameraCapture } from "./camera-capture";

export default async function CameraPage({ params }: PageProps<"/animais/[id]/fotos/[posicao]">) {
  const { id, posicao } = await params;
  const position = positionFromSlug(posicao);
  if (!position || !z.uuid().safeParse(id).success) notFound();
  const animal = await findAnimal(id);
  if (!animal) notFound();
  const images = await listImages(id);

  return (
    <CameraCapture
      animalId={animal.id}
      weightKg={animal.weightKg}
      position={position}
      initialCount={images.filter((img) => img.position === position).length}
    />
  );
}
