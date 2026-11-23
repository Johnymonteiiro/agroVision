import { connection } from "next/server";
import { listCategories } from "@/lib/categories/repo";
import { AnimalForm } from "./animal-form";

export default async function NovoAnimalPage() {
  await connection();
  const categories = await listCategories();
  return <AnimalForm categories={categories.map((c) => ({ id: c.id, name: c.name, description: c.description }))} />;
}
