import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as upload } from "@/app/api/animals/[id]/images/route";
import { PUT } from "@/app/api/animals/[id]/readiness/route";
import { getDb } from "@/modules/core/db/client";
import { animalImages, animals } from "@/modules/core/db/schema";
import { createAnimal, formRequest, makeJpeg, resetDb, uploadForm } from "../helpers/fixtures";

const put = (animalId: string, body: unknown) =>
  PUT(
    new Request(`http://test/api/animals/${animalId}/readiness`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: animalId }) },
  );

async function addPhoto(animalId: string) {
  const jpeg = await makeJpeg(800, 600);
  const { form } = uploadForm(new Blob([new Uint8Array(jpeg)], { type: "image/jpeg" }));
  const res = await upload(formRequest(`http://test/api/animals/${animalId}/images`, form), {
    params: Promise.resolve({ id: animalId }),
  });
  expect(res.status).toBe(201);
}

const animalReadiness = async (id: string) =>
  (await getDb().select({ r: animals.readiness }).from(animals).where(eq(animals.id, id)))[0].r;
const photoReadiness = async (id: string) =>
  (await getDb().select({ r: animalImages.readinessAtCapture }).from(animalImages).where(eq(animalImages.animalId, id))).map(
    (p) => p.r,
  );

beforeEach(resetDb);

describe("PUT /api/animals/{id}/readiness", () => {
  it("FROM_NOW muda so o animal", async () => {
    const animal = await createAnimal({ readiness: "NOT_READY" });
    await addPhoto(animal.id);
    await addPhoto(animal.id);
    const res = await put(animal.id, { readiness: "READY", scope: "FROM_NOW" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ animal: { id: animal.id, readiness: "READY" }, photosUpdated: 0 });
    expect(await animalReadiness(animal.id)).toBe("READY");
    expect(await photoReadiness(animal.id)).toEqual(["NOT_READY", "NOT_READY"]);
  });

  it("FIX_ALL_PHOTOS muda animal e fotos", async () => {
    const animal = await createAnimal({ readiness: "NOT_READY" });
    await addPhoto(animal.id);
    await addPhoto(animal.id);
    const res = await put(animal.id, { readiness: "READY", scope: "FIX_ALL_PHOTOS" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ animal: { id: animal.id, readiness: "READY" }, photosUpdated: 2 });
    expect(await animalReadiness(animal.id)).toBe("READY");
    expect(await photoReadiness(animal.id)).toEqual(["READY", "READY"]);
  });

  it("animal inexistente responde 404", async () => {
    expect((await put(randomUUID(), { readiness: "READY", scope: "FROM_NOW" })).status).toBe(404);
    expect((await put("nao-e-uuid", { readiness: "READY", scope: "FROM_NOW" })).status).toBe(404);
  });

  it("corpo invalido responde 422", async () => {
    const animal = await createAnimal({ readiness: "NOT_READY" });
    await addPhoto(animal.id);
    const badReadiness = await put(animal.id, { readiness: "PRONTO", scope: "FIX_ALL_PHOTOS" });
    expect(badReadiness.status).toBe(422);
    expect((await badReadiness.json()).fields.readiness).toBeTruthy();
    const badScope = await put(animal.id, { readiness: "READY", scope: "ALL" });
    expect(badScope.status).toBe(422);
    expect((await badScope.json()).fields.scope).toBeTruthy();
    expect(await animalReadiness(animal.id)).toBe("NOT_READY");
    expect(await photoReadiness(animal.id)).toEqual(["NOT_READY"]);
  });

  describe("falha no meio da correção", () => {
    // Um gatilho faz o UPDATE das fotos falhar no banco, depois que o UPDATE do animal já rodou.
    beforeEach(async () => {
      await getDb().execute(sql`
        create or replace function test_fail_image_update() returns trigger language plpgsql as $$
        begin raise exception 'falha simulada nas fotos'; end $$`);
      await getDb().execute(sql`
        create trigger test_fail_image_update before update on animal_images
        for each row execute function test_fail_image_update()`);
    });
    afterEach(async () => {
      await getDb().execute(sql`drop trigger if exists test_fail_image_update on animal_images`);
      await getDb().execute(sql`drop function if exists test_fail_image_update()`);
    });

    it("correcao que falha nao muda nada", async () => {
      const animal = await createAnimal({ readiness: "NOT_READY" });
      await addPhoto(animal.id);
      await addPhoto(animal.id);
      const res = await put(animal.id, { readiness: "READY", scope: "FIX_ALL_PHOTOS" });
      expect(res.status).toBe(500);
      expect(await animalReadiness(animal.id)).toBe("NOT_READY");
      expect(await photoReadiness(animal.id)).toEqual(["NOT_READY", "NOT_READY"]);
    });
  });
});
