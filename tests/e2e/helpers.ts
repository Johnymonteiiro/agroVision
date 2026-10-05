import { randomUUID } from "node:crypto";
import { expect, type APIRequestContext, type Page } from "@playwright/test";
import pg from "pg";
import sharp from "sharp";
import { TEST_ENV } from "../setup/env";

export async function resetDb() {
  const client = new pg.Client({ connectionString: TEST_ENV.DATABASE_URL });
  await client.connect();
  await client.query("truncate table animal_images, animals");
  await client.end();
}

export async function createAnimal(request: APIRequestContext, overrides: Record<string, unknown> = {}) {
  const body = {
    id: randomUUID(),
    externalId: "023",
    category: "TAURINE",
    sex: "MALE",
    age: 24,
    ageUnit: "MONTHS",
    weightKg: 485,
    ...overrides,
  };
  const res = await request.post("/api/animals", { data: body });
  expect(res.status()).toBe(201);
  return body;
}

export async function uploadPhoto(
  request: APIRequestContext,
  animalId: string,
  position: "REAR" | "TOP" | "SIDE",
  capturedAt = new Date(),
) {
  const jpeg = await sharp({ create: { width: 800, height: 600, channels: 3, background: { r: 120, g: 90, b: 60 } } })
    .jpeg()
    .toBuffer();
  const imageId = randomUUID();
  const res = await request.post(`/api/animals/${animalId}/images`, {
    multipart: {
      file: { name: "foto.jpg", mimeType: "image/jpeg", buffer: jpeg },
      imageId,
      position,
      framing: "FRAMED",
      minDistanceM: "2.1",
      capturedAt: capturedAt.toISOString(),
    },
  });
  expect(res.status()).toBe(201);
  return imageId;
}

export async function fillForm(
  page: Page,
  v: { externalId?: string; category?: "Taurino" | "Zebu"; age?: string; weight?: string; sex?: "Macho" | "Fêmea" },
) {
  if (v.externalId !== undefined) await page.getByLabel("Identificação").fill(v.externalId);
  if (v.category) await page.getByRole("button", { name: new RegExp(v.category) }).click();
  if (v.age !== undefined) await page.getByLabel("Idade", { exact: true }).fill(v.age);
  if (v.weight !== undefined) await page.getByLabel("Peso").fill(v.weight);
  if (v.sex) await page.getByRole("button", { name: v.sex }).click();
}

export const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};
