import { notFound } from "next/navigation";
import { z } from "zod";
import { animalTitle } from "@/modules/animals/format";
import { findAnimal, listImages } from "@/modules/animals/server/repo";
import { safeOrigin } from "@/modules/core/navigation/origin";
import { ReadinessForm } from "@/modules/animals/components/readiness-form";

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
