import { randomUUID } from "node:crypto";
import { asc, count, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/categories/route";
import { getDb } from "@/modules/core/db/client";
import { categories } from "@/modules/core/db/schema";
import { jsonRequest, resetDb } from "../helpers/fixtures";

const url = "http://test/api/categories";
const post = (body: unknown) => POST(jsonRequest(url, body));
const body = (overrides: Record<string, unknown> = {}) => ({ id: randomUUID(), name: "Nelore", description: null, ...overrides });
const total = async () => (await getDb().select({ n: count() }).from(categories))[0].n;
const named = async (name: string) =>
  (await getDb().select({ n: count() }).from(categories).where(sql`lower(trim(${categories.name})) = ${name}`))[0].n;

beforeEach(resetDb);

describe("categorias", () => {
  it("seed taurino e zebu", async () => {
    const rows = await getDb().select().from(categories).orderBy(asc(categories.id));
    expect(rows.map((r) => ({ id: r.id, name: r.name, description: r.description }))).toEqual([
      { id: "00000000-0000-4000-8000-000000000001", name: "Taurino", description: "Sem cupim" },
      { id: "00000000-0000-4000-8000-000000000002", name: "Zebu", description: "Com cupim" },
    ]);
  });
});

describe("POST /api/categories", () => {
  it("POST valido responde 201", async () => {
    const b = body({ description: "Cruzado zebuíno" });
    const res = await post(b);
    expect(res.status).toBe(201);
    expect((await res.json()).category).toMatchObject({ id: b.id, name: "Nelore", description: "Cruzado zebuíno" });
    expect(await total()).toBe(3);
  });

  it("nome fora dos limites responde 422", async () => {
    for (const name of ["", "   ", "x".repeat(31)]) {
      const res = await post(body({ name }));
      expect(res.status).toBe(422);
      expect((await res.json()).fields.name).toBe("Informe um nome de até 30 caracteres");
    }
    expect(await total()).toBe(2);
    expect((await post(body({ name: "y".repeat(30) }))).status).toBe(201);
    expect(await total()).toBe(3);
  });

  it("descricao fora do limite responde 422", async () => {
    const res = await post(body({ description: "d".repeat(41) }));
    expect(res.status).toBe(422);
    expect((await res.json()).fields.description).toBe("A descrição tem no máximo 40 caracteres");
    expect(await total()).toBe(2);
    expect((await post(body({ description: "d".repeat(40) }))).status).toBe(201);
    expect(await total()).toBe(3);
  });

  it("nome duplicado sem caixa e espacos responde 409", async () => {
    expect((await post(body({ name: "Nelore" }))).status).toBe(201);
    for (const name of ["nelore ", "NELORE"]) {
      const res = await post(body({ name }));
      expect(res.status).toBe(409);
      expect((await res.json()).fields.name).toBe("Já existe uma categoria com este nome.");
    }
    expect(await named("nelore")).toBe(1);
  });

  it("mesmo id responde 200", async () => {
    const b = body();
    expect((await post(b)).status).toBe(201);
    const again = await post({ ...b, name: "Outro nome" });
    expect(again.status).toBe(200);
    expect((await again.json()).category).toMatchObject({ id: b.id, name: "Nelore" });
    expect(await total()).toBe(3);
  });

  it("concorrencia no nome: um 201, um 409, uma linha", async () => {
    const [a, b] = await Promise.all([post(body({ name: "Angus" })), post(body({ name: "Angus" }))]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect(await named("angus")).toBe(1);
  });
});
