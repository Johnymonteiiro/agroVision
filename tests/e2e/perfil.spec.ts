import { expect, test } from "@playwright/test";
import { createAnimal, resetDb, uploadPhoto } from "./helpers";

test.beforeEach(async () => {
  await resetDb();
});

test("topo sem foto mostra placeholder e voltar", async ({ page, request }) => {
  const animal = await createAnimal(request);
  await page.goto(`/animais/${animal.id}`);
  await expect(page.getByTestId("hero-placeholder").locator('[data-icon="photo_camera"]')).toBeVisible();
  await page.getByRole("link", { name: "Voltar" }).click();
  await expect(page).toHaveURL(/\/animais$/);
});

test("cartao do perfil", async ({ page, request }) => {
  const animal = await createAnimal(request, { externalId: "023", category: "TAURINE", sex: "MALE", age: 24, weightKg: 485 });
  await page.goto(`/animais/${animal.id}`);
  const card = page.getByTestId("profile-card");
  const title = card.getByRole("heading", { name: "Animal #023" });
  await expect(title).toHaveCSS("font-size", "26px");
  await expect(title).toHaveCSS("font-weight", "700");
  await expect(card).toContainText("Taurino • Macho");
  await expect(card).toContainText("24 meses • 485 kg");
  const grid = await card.locator("dl > div").allInnerTexts();
  expect(grid.map((t) => t.replace(/\s+/g, " ").trim())).toEqual([
    "Categoria Taurino",
    "Sexo Macho",
    "Idade 24 m",
    "Peso 485 kg",
  ]);
  await expect(card.getByRole("link", { name: "Fotografar animal" })).toBeVisible();
});

test("fotos por posicao da mais recente para a mais antiga", async ({ page, request }) => {
  const animal = await createAnimal(request);
  const older = await uploadPhoto(request, animal.id, "SIDE", new Date(Date.now() - 60_000));
  const newer = await uploadPhoto(request, animal.id, "SIDE", new Date());
  await page.goto(`/animais/${animal.id}`);
  const side = page.getByTestId("position-SIDE");
  await expect(side.getByTestId("position-count")).toHaveText("2 fotos");
  const ids = await side.locator("img").evaluateAll((imgs) => imgs.map((i) => i.getAttribute("data-image-id")));
  expect(ids).toEqual([newer, older]);
});

test("posicao vazia oferece adicionar fotos", async ({ page, request }) => {
  const animal = await createAnimal(request);
  await uploadPhoto(request, animal.id, "SIDE");
  await uploadPhoto(request, animal.id, "SIDE");
  await page.goto(`/animais/${animal.id}`);
  for (const [position, slug] of [
    ["REAR", "de-tras"],
    ["TOP", "de-cima"],
  ]) {
    const section = page.getByTestId(`position-${position}`);
    await expect(section).toContainText("Nenhuma foto");
    await expect(section.getByRole("link", { name: "Adicionar fotos" })).toHaveAttribute(
      "href",
      `/animais/${animal.id}/fotos/${slug}`,
    );
  }
  await page.getByTestId("position-TOP").getByRole("link", { name: "Adicionar fotos" }).click();
  await expect(page.getByTestId("camera-position")).toHaveText("De cima");
});
