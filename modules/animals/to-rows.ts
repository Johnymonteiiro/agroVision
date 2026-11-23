import { animalSummary } from "@/modules/animals/format";
import { formatWhen } from "@/modules/core/format/date";
import type { AnimalListItem } from "@/modules/animals/server/repo";
import type { AnimalRow } from "@/modules/animals/components/animals-list";

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
