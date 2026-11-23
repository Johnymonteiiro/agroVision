import { expect, test, type Page, type Request } from "@playwright/test";
import {
  COW_PHOTO,
  createAnimal,
  fakeDetector,
  fillForm,
  galleryImage,
  releaseDetector,
  resetDb,
  rgb,
} from "./helpers";

// qualidade-imagem: checagem de qualidade na revisão (câmera e galeria, dataset e avaliação).
// A câmera falsa mostra a foto de referência (playwright.config.ts); o detector é o falso de helpers.ts.

let animalId: string;

test.beforeEach(async ({ request }) => {
  await resetDb();
  animalId = (await createAnimal(request, { weightKg: 450 })).id;
});

type GalleryFile = string | Awaited<ReturnType<typeof galleryImage>>;

const issues = (page: Page) => page.getByTestId("quality-issue");

async function shoot(page: Page) {
  await page.goto(`/animais/${animalId}/fotos/lateral`);
  await expect(page.getByTestId("shutter")).toBeEnabled();
  await expect(page.getByTestId("framing-status")).not.toHaveAttribute("data-framing", "LOADING");
  await page.getByTestId("shutter").click();
  await expect(page.getByTestId("review")).toBeVisible();
}

async function evaluationGallery(page: Page, file: GalleryFile) {
  await page.goto("/");
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Escolher da galeria" }).click();
  await (await chooser).setFiles(file);
  await expect(page.getByTestId("review")).toBeVisible();
}

async function formGallery(page: Page, file: GalleryFile) {
  await page.goto("/dataset/novo");
  await page.getByRole("button", { name: "Galeria", exact: true }).click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("dialog").getByRole("button", { name: "Lateral" }).click();
  await (await chooser).setFiles(file);
  // dataset-ajustes C28: a foto da galeria passa pela revisão; espera a análise e usa a foto.
  const review = page.getByTestId("review");
  await expect(review.getByTestId("quality-checking")).toHaveCount(0);
  await review.getByRole("button", { name: /^Usar (foto|mesmo assim)$/ }).click();
  await expect(page.getByTestId("photo-preview")).toBeVisible();
}

function field(req: Request, name: string) {
  const body = req.postDataBuffer()?.toString("latin1") ?? "";
  return new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]+)`).exec(body)?.[1];
}

test("camera mede a foto e conta bovinos", async ({ page }) => {
  await fakeDetector(page, { animals: 1 });
  await shoot(page);
  await expect(page.getByTestId("quality-issues")).toHaveCount(0);

  await page.getByRole("button", { name: "Tirar outra foto" }).click();
  await page.evaluate(() => ((window as unknown as Record<string, unknown>).__gadoAnimals = 0));
  await expect(page.getByTestId("framing-status")).toHaveAttribute("data-framing", "NOT_DETECTED");
  await page.getByTestId("shutter").click();
  await expect(issues(page)).toHaveText(["Nenhum bovino encontrado"]);
});

test("galeria mede a foto com o detector de imagem", async ({ page }) => {
  const black = await galleryImage("black");
  await fakeDetector(page, { animals: 1 });
  await formGallery(page, black);
  await expect(page.getByTestId("field-photo").getByTestId("quality-issue")).toHaveText(["Foto desfocada", "Foto muito escura"]);

  await evaluationGallery(page, black);
  await expect(issues(page)).toHaveText(["Foto desfocada", "Foto muito escura"]);

  await page.evaluate(() => ((window as unknown as Record<string, unknown>).__gadoAnimals = 0));
  await evaluationGallery(page, black);
  await expect(issues(page)).toHaveText(["Nenhum bovino encontrado", "Foto desfocada", "Foto muito escura"]);
});

test("detector indisponivel nao aponta animal", async ({ page }) => {
  const sent: Array<string | undefined> = [];
  await page.route(`**/api/animals/${animalId}/images`, async (route) => {
    sent.push(field(route.request(), "animalCount"));
    await route.continue();
  });
  await page.addInitScript(() => {
    (window as unknown as Record<string, unknown>).__gadoDetector = () => Promise.reject(new Error("falha simulada"));
  });
  await page.goto(`/animais/${animalId}/fotos/lateral`);
  await expect(page.getByTestId("framing-status")).toHaveAttribute("data-framing", "UNAVAILABLE");
  await page.getByTestId("shutter").click();
  await expect(page.getByText("Nenhum bovino encontrado")).toHaveCount(0);
  await expect(page.getByText("Mais de um animal na foto")).toHaveCount(0);
  const response = page.waitForResponse((r) => r.url().endsWith(`/api/animals/${animalId}/images`));
  await page.getByRole("button", { name: "Usar foto" }).click();
  expect((await response).status()).toBe(201);
  expect(sent).toEqual([undefined]);
});

test("lista de problemas na revisao", async ({ page }) => {
  await fakeDetector(page, { animals: 0 });
  await evaluationGallery(page, await galleryImage("black"));
  await expect(issues(page)).toHaveText(["Nenhum bovino encontrado", "Foto desfocada", "Foto muito escura"]);
  await expect(page.getByTestId("quality-issues")).toHaveCSS("background-color", rgb("#FBF4E6"));
  for (const icon of await issues(page).locator('[data-icon="warning"]').all()) {
    await expect(icon).toHaveCSS("color", rgb("#9A6508"));
  }
  await expect(issues(page).locator('[data-icon="warning"]')).toHaveCount(3);

  await evaluationGallery(page, await galleryImage("white"));
  await expect(issues(page)).toContainText(["Foto muito clara"]);
});

test("foto boa sem lista", async ({ page }) => {
  await fakeDetector(page, { animals: 1 });
  await evaluationGallery(page, COW_PHOTO);
  await expect(page.getByTestId("quality-checking")).toHaveCount(0);
  await expect(page.getByTestId("quality-issues")).toHaveCount(0);
});

test("dataset usar mesmo assim", async ({ page }) => {
  await fakeDetector(page, { animals: 0 });
  await shoot(page);
  const anyway = page.getByRole("button", { name: "Usar mesmo assim" });
  await expect(anyway).toBeEnabled();
  const response = page.waitForResponse((r) => r.url().endsWith(`/api/animals/${animalId}/images`));
  await anyway.click();
  expect((await response).status()).toBe(201);

  await page.evaluate(() => ((window as unknown as Record<string, unknown>).__gadoAnimals = 1));
  await expect(page.getByTestId("framing-status")).not.toHaveAttribute("data-framing", "NOT_DETECTED");
  await page.getByTestId("shutter").click();
  await expect(page.getByRole("button", { name: "Usar foto" })).toBeVisible();
});

test("avaliacao analisar mesmo assim", async ({ page }) => {
  await fakeDetector(page, { animals: 1 });
  await evaluationGallery(page, await galleryImage("black"));
  const anyway = page.getByRole("button", { name: "Analisar mesmo assim" });
  await expect(anyway).toBeEnabled();
  await anyway.click();
  await expect(page.getByText("Modelo de IA ainda não disponível")).toBeVisible();

  await evaluationGallery(page, COW_PHOTO);
  await expect(page.getByTestId("quality-checking")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Analisar imagem" })).toBeVisible();
});

test("verificando a foto", async ({ page }) => {
  await fakeDetector(page, { animals: 0, hold: true });
  await evaluationGallery(page, await galleryImage("black"));
  await expect(page.getByTestId("quality-checking")).toHaveText("Verificando a foto...");
  await expect(page.getByRole("button", { name: /^Analisar/ })).toBeEnabled();
  await releaseDetector(page);
  await expect(page.getByTestId("quality-checking")).toHaveCount(0);
  await expect(issues(page)).toHaveText(["Nenhum bovino encontrado", "Foto desfocada", "Foto muito escura"]);
});

test("cadastro avisa sem bloquear", async ({ page }) => {
  await fakeDetector(page, { animals: 1 });
  await formGallery(page, await galleryImage("black"));
  const block = page.getByTestId("field-photo");
  await expect(block.getByTestId("quality-issue")).toHaveText(["Foto desfocada", "Foto muito escura"]);
  const preview = (await block.getByTestId("photo-preview").boundingBox())!;
  const list = (await block.getByTestId("quality-issues").boundingBox())!;
  expect(list.y).toBeGreaterThanOrEqual(preview.y + preview.height);

  await fillForm(page, { externalId: "Q1", category: "Taurino", readiness: "Pronto", age: "24", weight: "485", sex: "Macho" });
  const save = page.getByRole("button", { name: "Salvar animal" });
  await expect(save).toBeEnabled();
  const created = page.waitForResponse((r) => r.url().endsWith("/api/animals") && r.request().method() === "POST");
  await save.click();
  expect((await created).status()).toBe(201);
  await expect(page).toHaveURL(/\/animais\/[0-9a-f-]{36}$/);
});

test("camera envia as metricas", async ({ page }) => {
  const sent: Record<string, string | undefined>[] = [];
  await page.route(`**/api/animals/${animalId}/images`, async (route) => {
    const req = route.request();
    sent.push({ brightness: field(req, "brightness"), sharpness: field(req, "sharpness"), animalCount: field(req, "animalCount") });
    await route.continue();
  });
  await fakeDetector(page, { animals: 1 });
  await shoot(page);
  const response = page.waitForResponse((r) => r.url().endsWith(`/api/animals/${animalId}/images`));
  await page.getByRole("button", { name: "Usar foto" }).click();
  const { image } = await (await response).json();
  expect(sent).toHaveLength(1);
  expect(Number(sent[0].brightness)).toBeGreaterThan(0);
  expect(Number(sent[0].sharpness)).toBeGreaterThan(0);
  expect(sent[0].animalCount).toBe("1");
  expect(image).toMatchObject({ animalCount: 1 });
  expect(image.brightness).toBeCloseTo(Number(sent[0].brightness), 1);
});
