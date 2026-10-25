import { expect, test } from "@playwright/test";
import { createAnimal, resetDb, uploadPhoto } from "./helpers";

test.beforeEach(async () => {
  await resetDb();
});

test("raiz redireciona para animais", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/animais$/);
});

test("cabecalho da lista", async ({ page, request }) => {
  await createAnimal(request, { externalId: "A12" });
  await createAnimal(request, { externalId: "B7" });
  await page.goto("/animais");
  await expect(page.getByRole("heading", { name: "Animais" })).toBeVisible();
  await expect(page.getByText("2 cadastrados")).toBeVisible();
  await page.getByRole("link", { name: "Adicionar animal" }).click();
  await expect(page).toHaveURL(/\/animais\/novo$/);
});

test("item e ordem", async ({ page, request }) => {
  const old = await createAnimal(request, { externalId: "011", category: "TAURINE", sex: "FEMALE", age: 18, weightKg: 368 });
  await uploadPhoto(request, old.id, "SIDE");
  await createAnimal(request, { externalId: "023", category: "TAURINE", sex: "MALE", age: 24, weightKg: 485 });
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

test("selo de fotos", async ({ page, request }) => {
  const withPhotos = await createAnimal(request, { externalId: "A12" });
  await uploadPhoto(request, withPhotos.id, "SIDE");
  await uploadPhoto(request, withPhotos.id, "REAR");
  await createAnimal(request, { externalId: "B7" });
  await page.goto("/animais");
  await expect(page.getByTestId("animal-item").filter({ hasText: "Animal #A12" })).toContainText("2 FOTOS");
  await expect(page.getByTestId("animal-item").filter({ hasText: "Animal #B7" })).toContainText("SEM FOTOS");
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
  await createAnimal(request, { externalId: "T1", category: "TAURINE", sex: "MALE" });
  await createAnimal(request, { externalId: "Z1", category: "ZEBU", sex: "FEMALE" });
  await page.goto("/animais");
  const expected: Array<[string, string[]]> = [
    ["Taurino", ["Animal #T1"]],
    ["Zebu", ["Animal #Z1"]],
    ["Machos", ["Animal #T1"]],
    ["Fêmeas", ["Animal #Z1"]],
    ["Todos", ["Animal #Z1", "Animal #T1"]],
  ];
  for (const [chip, titles] of expected) {
    await page.getByRole("button", { name: chip, exact: true }).click();
    const items = page.getByTestId("animal-item");
    await expect(items).toHaveCount(titles.length);
    for (const [i, title] of titles.entries()) await expect(items.nth(i)).toContainText(title);
  }
});

test("estado vazio", async ({ page }) => {
  await page.goto("/animais");
  await expect(page.getByText("Nenhum animal cadastrado")).toBeVisible();
  await expect(page.locator('[data-icon="sell"]')).toBeVisible();
  await expect(page.getByRole("link", { name: "Adicionar animal" }).last()).toBeVisible();
});

test("busca sem resultado", async ({ page, request }) => {
  await createAnimal(request, { externalId: "A12" });
  await page.goto("/animais");
  await page.getByPlaceholder("Buscar brinco ou ID").fill("zzz");
  await expect(page.getByText("Nenhum animal encontrado")).toBeVisible();
});
