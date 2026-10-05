import { randomUUID } from "node:crypto";
import { count } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/animals/route";
import { birthDateFromAge } from "@/lib/animals/age";
import { getDb } from "@/lib/db/client";
import { animals } from "@/lib/db/schema";
import { animalBody, jsonRequest, resetDb } from "../helpers/fixtures";

const url = "http://test/api/animals";
const post = (body: unknown) => POST(jsonRequest(url, body));
const total = async () => (await getDb().select({ n: count() }).from(animals))[0].n;

beforeEach(resetDb);

describe("POST /api/animals", () => {
  it("POST valido responde 201", async () => {
    const body = animalBody({ externalId: "023" });
    const res = await post(body);
    expect(res.status).toBe(201);
    const { animal } = await res.json();
    expect(animal).toMatchObject({ id: body.id, externalId: "023", category: "TAURINE", sex: "MALE", weightKg: 485 });
    expect(await total()).toBe(1);
  });

  it("grava birth_date_estimated como hoje menos a idade", async () => {
    const months = animalBody({ age: 24, ageUnit: "MONTHS" });
    const years = animalBody({ age: 2, ageUnit: "YEARS" });
    await post(months);
    await post(years);
    const rows = await getDb().select().from(animals);
    const expected = birthDateFromAge(24, "MONTHS");
    expect(rows.find((r) => r.id === months.id)?.birthDateEstimated).toBe(expected);
    expect(rows.find((r) => r.id === years.id)?.birthDateEstimated).toBe(expected);
  });

  it("identificacao duplicada responde 409", async () => {
    await post(animalBody({ externalId: "A12" }));
    const res = await post(animalBody({ externalId: "a12 " }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.fields.externalId).toBe("Já existe um animal com este ID.");
    expect(await total()).toBe(1);
  });

  it("mesmo id responde 200 com o animal gravado", async () => {
    const body = animalBody();
    expect((await post(body)).status).toBe(201);
    const again = await post({ ...body, weightKg: 600 });
    expect(again.status).toBe(200);
    expect((await again.json()).animal).toMatchObject({ id: body.id, weightKg: 485 });
    expect(await total()).toBe(1);
  });

  it("corpo invalido responde 422 com cada campo", async () => {
    const body = animalBody({ weightKg: 10 }) as Record<string, unknown>;
    delete body.category;
    const res = await post(body);
    expect(res.status).toBe(422);
    const { fields } = await res.json();
    expect(fields.category).toBeTruthy();
    expect(fields.weightKg).toBe("Confira o peso informado");
    expect(await total()).toBe(0);
  });

  it("concorrencia na identificacao: um 201, um 409, uma linha", async () => {
    const [a, b] = await Promise.all([
      post(animalBody({ id: randomUUID(), externalId: "C77" })),
      post(animalBody({ id: randomUUID(), externalId: "c77" })),
    ]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect(await total()).toBe(1);
  });
});
