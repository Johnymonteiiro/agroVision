import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, type Db } from "@/modules/core/db/client";
import { animalImages } from "@/modules/core/db/schema";
import { getObjectStore, type ObjectStore } from "@/modules/core/storage/object-store";

export type DeleteDeps = { db: Db; store: ObjectStore };

/**
 * Exclui uma foto de vez (dataset-ajustes, door 1): primeiro a linha, que é a fonte da verdade, depois
 * os objetos. Se o MinIO falhar, a foto já saiu do dataset; as chaves vão para o log para limpar o bucket.
 */
export async function deleteAnimalImage(
  id: string,
  deps: DeleteDeps = { db: getDb(), store: getObjectStore() },
): Promise<Response> {
  if (!z.uuid().safeParse(id).success) return Response.json({ error: "not_found" }, { status: 404 });
  const { db, store } = deps;

  let removed: { objectKey: string; thumbKey: string } | undefined;
  try {
    [removed] = await db
      .delete(animalImages)
      .where(eq(animalImages.id, id))
      .returning({ objectKey: animalImages.objectKey, thumbKey: animalImages.thumbKey });
  } catch (error) {
    console.error("exclusão da foto falhou no banco", { imageId: id, error });
    return Response.json({ error: "database_error" }, { status: 500 });
  }
  if (!removed) return Response.json({ error: "not_found" }, { status: 404 });

  const keys = [removed.objectKey, removed.thumbKey];
  const results = await Promise.allSettled(keys.map((key) => store.remove(key)));
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.error("objetos da foto excluída ficaram no bucket", {
      imageId: id,
      keys,
      errors: failed.map((r) => (r as PromiseRejectedResult).reason),
    });
  }
  return new Response(null, { status: 204 });
}
