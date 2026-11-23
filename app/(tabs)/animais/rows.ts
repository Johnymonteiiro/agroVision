import { animalSummary, formatWhen } from "@/lib/animals/format";
import type { AnimalListItem } from "@/lib/animals/repo";
import type { AnimalRow } from "./animals-list";

export function toAnimalRows(animals: AnimalListItem[]): AnimalRow[] {
  return animals.map((a) => {
    const summary = animalSummary(a);
    return {
      id: a.id,
      externalId: a.externalId,
      categoryId: a.categoryId,
      readiness: a.readiness,
      sex: a.sex,
      title: summary.title,
      line1: summary.line1,
      line2: summary.line2,
      photoCount: a.photoCount,
      lastPhoto: a.lastPhotoAt ? formatWhen(a.lastPhotoAt) : null,
      thumbUrl: a.mainPhotoId ? `/api/images/${a.mainPhotoId}?variant=thumb` : null,
    };
  });
}
