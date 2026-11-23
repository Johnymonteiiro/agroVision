import { notFound } from "next/navigation";
import { z } from "zod";
import { animalTitle } from "@/lib/animals/format";
import { findAnimal, listImages } from "@/lib/animals/repo";
import { safeOrigin } from "@/lib/evaluation/origin";
import { ReadinessForm } from "./readiness-form";

export default async function RotuloPage({ params, searchParams }: PageProps<"/animais/[id]/rotulo">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const animal = await findAnimal(id);
  if (!animal) notFound();
  const [images, { de }] = await Promise.all([listImages(id), searchParams]);

  return (
    <ReadinessForm
      animalId={animal.id}
      title={animalTitle(animal.externalId)}
      current={animal.readiness}
      photoCount={images.length}
      origin={safeOrigin(de, `/animais/${animal.id}`)}
    />
  );
}
