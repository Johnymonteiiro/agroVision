import { connection } from "next/server";
import { listCategories } from "@/modules/categories/server/repo";
import { AnimalForm } from "@/modules/dataset/components/animal-form";

export default async function NovoAnimalPage() {
  await connection();
  const categories = await listCategories();
  return (
    <AnimalForm
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        imageUrl: c.imageKey ? `/api/categories/${c.id}/image` : null,
      }))}
    />
  );
}
