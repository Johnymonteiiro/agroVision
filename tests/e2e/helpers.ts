import { randomUUID } from "node:crypto";
import path from "node:path";
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

export const COW_PHOTO = path.join(process.cwd(), "tests", "fixtures", "cow-side.jpg");

export async function fillForm(
  page: Page,
  v: {
    photo?: "De trás" | "De cima" | "Lateral";
    externalId?: string;
    category?: "Taurino" | "Zebu";
    age?: string;
    weight?: string;
    sex?: "Macho" | "Fêmea";
  },
) {
  if (v.photo) {
    // Pela galeria: a câmera falsa do Chromium não serve para escolher a foto do formulário.
    await page.getByRole("button", { name: "Galeria", exact: true }).click();
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("dialog").getByRole("button", { name: v.photo }).click();
    await (await chooser).setFiles(COW_PHOTO);
    await expect(page.getByTestId("photo-preview")).toBeVisible();
  }
  if (v.externalId !== undefined) await page.getByLabel("Identificação").fill(v.externalId);
  if (v.category) await page.getByRole("button", { name: new RegExp(v.category) }).click();
  if (v.age !== undefined) await page.getByLabel("Idade", { exact: true }).fill(v.age);
  if (v.weight !== undefined) await page.getByLabel("Peso").fill(v.weight);
  if (v.sex) await page.getByRole("button", { name: v.sex }).click();
}

/** Todo botão, link e campo visível com pelo menos 44 × 44 px; ações principais entre 56 e 60 px de altura. */
export async function assertTouchTargets(page: Page) {
  const report = await page.evaluate(() => {
    const els = [...document.querySelectorAll<HTMLElement>("a, button, input")].filter((el) => el.offsetParent !== null);
    return els.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        label: el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 30) ?? el.tagName,
        w: Math.round(r.width),
        h: Math.round(r.height),
        primary: el.hasAttribute("data-primary-action"),
      };
    });
  });
  for (const t of report) {
    expect.soft(t.w, `largura de "${t.label}"`).toBeGreaterThanOrEqual(44);
    expect.soft(t.h, `altura de "${t.label}"`).toBeGreaterThanOrEqual(44);
    if (t.primary) {
      expect.soft(t.h, `altura da ação principal "${t.label}"`).toBeGreaterThanOrEqual(56);
      expect.soft(t.h, `altura da ação principal "${t.label}"`).toBeLessThanOrEqual(60);
    }
  }
  expect(report.length).toBeGreaterThan(0);
}

type FakeModel = {
  load?: "ready" | "pending" | "fail";
  holdClassify?: boolean;
  classifyFails?: boolean;
  ready?: number;
  notReady?: number;
  version?: string;
};

/**
 * Instala um classificador pelo gancho `window.__agroClassifier` (lib/evaluation/classifier.ts).
 * O teste controla o carregamento (`__releaseModel`, `__failLoad`), a classificação (`__releaseClassify`)
 * e as probabilidades devolvidas (`__probs`).
 */
export async function fakeClassifier(page: Page, m: FakeModel = {}) {
  await page.addInitScript((m: FakeModel) => {
    const w = window as unknown as Record<string, unknown>;
    w.__failLoad = m.load === "fail";
    w.__probs = { ready: m.ready ?? 0.914, notReady: m.notReady ?? 0.086 };
    const classifier = {
      model: { name: "CattleClassifier", version: m.version ?? "1.4.0", threshold: { READY: 0.85, NOT_READY: 0.85 } },
      classify: () =>
        new Promise((resolve, reject) => {
          if (m.classifyFails) return reject(new Error("falha simulada na classificação"));
          const done = () => {
            w.__releaseClassify = undefined;
            resolve(w.__probs);
          };
          if (m.holdClassify) w.__releaseClassify = done;
          else done();
        }),
    };
    w.__agroClassifier = () => {
      if (w.__failLoad) return Promise.reject(new Error("falha simulada"));
      if (m.load === "pending") return new Promise((resolve) => (w.__releaseModel = () => resolve(classifier)));
      return Promise.resolve(classifier);
    };
  }, m);
}

/** Libera a classificação retida por `holdClassify`, esperando o `classify` da análise atual ser chamado. */
export async function releaseClassify(page: Page) {
  await page.waitForFunction(() => typeof (window as unknown as Record<string, unknown>).__releaseClassify === "function");
  await page.evaluate(() => (window as unknown as { __releaseClassify: () => void }).__releaseClassify());
}

/** Linhas de `animal_images`, para conferir o que o upload gravou. */
export async function imageRows() {
  const client = new pg.Client({ connectionString: TEST_ENV.DATABASE_URL });
  await client.connect();
  const { rows } = await client.query<{ position: string; framing: string }>("select position, framing from animal_images");
  await client.end();
  return rows;
}

/** Detector de enquadramento sem detecções, para a câmera não carregar o MediaPipe real. */
export async function fakeDetector(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as Record<string, unknown>).__gadoDetector = () => Promise.resolve({ detect: () => [] });
  });
}

export const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};
