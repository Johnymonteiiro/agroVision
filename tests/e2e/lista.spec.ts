import { expect, test } from "@playwright/test";
import { ZEBU_ID } from "../../modules/categories/seed";
import { createAnimal, createCategory, resetDb, rgb, uploadPhoto } from "./helpers";

test.beforeEach(async () => {
  await resetDb();
});

// C22 da F1 ("/ termina em /animais") foi substituído pela Home em "/" (fluxo-avaliacao C1).
test("lista continua em /animais", async ({ page }) => {
  await page.goto("/animais");
  await expect(page.getByRole("heading", { name: "Animais" })).toBeVisible();
});

// F1 C23 substituído por dataset-rotulos AC 37: o cadastro saiu da aba Animais.
test("cabecalho da lista", async ({ page, request }) => {
  await createAnimal(request, { externalId: "A12" });
  await createAnimal(request, { externalId: "B7" });
  await page.goto("/animais");
  await expect(page.getByRole("heading", { name: "Animais" })).toBeVisible();
  await expect(page.getByText("2 cadastrados")).toBeVisible();
});

test("aba animais sem adicionar animal", async ({ page, request }) => {
  await page.goto("/animais");
  await expect(page.getByText("Nenhum animal cadastrado")).toBeVisible();
  await expect(page.getByRole("link", { name: "Adicionar animal" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Adicionar animal" })).toHaveCount(0);
  await createAnimal(request, { externalId: "A12" });
  await page.reload();
  await expect(page.getByTestId("animal-item")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Adicionar animal" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Adicionar animal" })).toHaveCount(0);
});

test("item e ordem", async ({ page, request }) => {
  const old = await createAnimal(request, { externalId: "011", sex: "FEMALE", age: 18, weightKg: 368 });
  await uploadPhoto(request, old.id, "SIDE");
  await createAnimal(request, { externalId: "023", sex: "MALE", age: 24, weightKg: 485 });
  await page.goto("/animais");

  const items = page.getByTestId("animal-item");
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText("Animal #023");
  await expect(items.nth(0)).toContainText("Taurino • Macho");
  await expect(items.nth(0)).toContainText("24 meses • 485 kg");
  await expect(items.nth(1)).toContainText("Animal #011");
  await expect(items.nth(1)).toContainText("Última foto: Hoje");

  for (const i of [0, 1]) {
    const box = await items.nth(i).locator("img, .placeholder-stripes").first().boundingBox();
    expect([Math.round(box!.width), Math.round(box!.height)]).toEqual([76, 76]);
  }
});

test("item com categoria cadastrada", async ({ page, request }) => {
  const nelore = await createCategory(request, "Nelore");
  await createAnimal(request, { externalId: "N1", categoryId: nelore, sex: "FEMALE" });
  await page.goto("/animais");
  await expect(page.getByTestId("animal-item")).toContainText("Nelore • Fêmea");
});

test("selo de fotos", async ({ page, request }) => {
  const withPhotos = await createAnimal(request, { externalId: "A12" });
  await uploadPhoto(request, withPhotos.id, "SIDE");
  await uploadPhoto(request, withPhotos.id, "REAR");
  await createAnimal(request, { externalId: "B7" });
  await page.goto("/animais");
  await expect(page.getByTestId("animal-item").filter({ hasText: "Animal #A12" })).toContainText("2 FOTOS");
  await expect(page.getByTestId("animal-item").filter({ hasText: "Animal #B7" })).toContainText("SEM FOTOS");
});

test("selo do rotulo na linha", async ({ page, request }) => {
  await createAnimal(request, { externalId: "R1", readiness: "READY" });
  await createAnimal(request, { externalId: "N1", readiness: "NOT_READY" });
  await page.goto("/animais");
  const ready = page.getByTestId("animal-item").filter({ hasText: "Animal #R1" }).getByTestId("readiness-badge");
  const notReady = page.getByTestId("animal-item").filter({ hasText: "Animal #N1" }).getByTestId("readiness-badge");
  await expect(ready).toHaveText("PRONTO");
  await expect(ready).toHaveCSS("background-color", rgb("#E3F3EA"));
  await expect(ready).toHaveCSS("color", rgb("#136B3C"));
  await expect(notReady).toHaveText("NÃO PRONTO");
  await expect(notReady).toHaveCSS("background-color", rgb("#FAEBE8"));
  await expect(notReady).toHaveCSS("color", rgb("#C74A3A"));
});

test("busca por identificacao", async ({ page, request }) => {
  await createAnimal(request, { externalId: "A12" });
  await createAnimal(request, { externalId: "B7" });
  await page.goto("/animais");
  await page.getByPlaceholder("Buscar brinco ou ID").fill("a1");
  await expect(page.getByTestId("animal-item")).toHaveCount(1);
  await expect(page.getByTestId("animal-item")).toContainText("Animal #A12");
});

test("chips de filtro", async ({ page, request }) => {
  const nelore = await createCategory(request, "Nelore");
  await createAnimal(request, { externalId: "T1", sex: "MALE" });
  await createAnimal(request, { externalId: "N1", categoryId: nelore, sex: "FEMALE" });
  await page.goto("/animais");
  const labels = await page.getByRole("group", { name: "Filtros" }).getByRole("button").allInnerTexts();
  expect(labels.map((l) => l.trim())).toEqual(["Todos", "Taurino", "Zebu", "Nelore", "Machos", "Fêmeas"]);
  const expected: Array<[string, string[]]> = [
    ["Taurino", ["Animal #T1"]],
    ["Zebu", []],
    ["Nelore", ["Animal #N1"]],
    ["Machos", ["Animal #T1"]],
    ["Fêmeas", ["Animal #N1"]],
    ["Todos", ["Animal #N1", "Animal #T1"]],
  ];
  for (const [chip, titles] of expected) {
    await page.getByRole("button", { name: chip, exact: true }).click();
    const items = page.getByTestId("animal-item");
    await expect(items).toHaveCount(titles.length);
    for (const [i, title] of titles.entries()) await expect(items.nth(i)).toContainText(title);
  }
  // Zebu continua sendo filtro mesmo sem animal; com um, ele aparece.
  await createAnimal(request, { externalId: "Z1", categoryId: ZEBU_ID, sex: "FEMALE" });
  await page.reload();
  await page.getByRole("button", { name: "Zebu", exact: true }).click();
  await expect(page.getByTestId("animal-item")).toHaveCount(1);
  await expect(page.getByTestId("animal-item")).toContainText("Animal #Z1");
});

// F1 C28 substituído por dataset-rotulos AC 38.
test("estado vazio", async ({ page }) => {
  await page.goto("/animais");
  await expect(page.getByText("Nenhum animal cadastrado")).toBeVisible();
  // A aba Animais da barra inferior também usa o ícone sell; o estado vazio é o do conteúdo.
  await expect(page.getByRole("main").locator('[data-icon="sell"]')).toBeVisible();
  await expect(page.getByText("Cadastre animais na aba Dataset.")).toBeVisible();
  const go = page.getByRole("link", { name: "Ir para Dataset" });
  expect((await go.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await go.click();
  await expect(page).toHaveURL(/\/dataset$/);
});

test("busca sem resultado", async ({ page, request }) => {
  await createAnimal(request, { externalId: "A12" });
  await page.goto("/animais");
  await page.getByPlaceholder("Buscar brinco ou ID").fill("zzz");
  await expect(page.getByText("Nenhum animal encontrado")).toBeVisible();
});
