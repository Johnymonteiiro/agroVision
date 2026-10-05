import { expect, test } from "@playwright/test";
import { createAnimal, fillForm, resetDb, rgb } from "./helpers";

test.beforeEach(async ({ page }) => {
  await resetDb();
  await page.goto("/animais/novo");
});

const complete = { externalId: "023", category: "Taurino", age: "24", weight: "485", sex: "Macho" } as const;
const saveButton = (page: import("@playwright/test").Page) => page.getByRole("button", { name: "Salvar animal" });

test("salvar cria o animal e abre o perfil", async ({ page }) => {
  await fillForm(page, complete);
  const response = page.waitForResponse((r) => r.url().endsWith("/api/animals") && r.request().method() === "POST");
  await saveButton(page).click();
  expect((await response).status()).toBe(201);
  await expect(page).toHaveURL(/\/animais\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "Animal #023" })).toBeVisible();
});

test("ordem dos campos e cabecalho do formulario", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Novo animal" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Fechar" }).locator('[data-icon="close"]')).toBeVisible();
  const order = await page.locator('[data-testid="form-fields"] > [data-testid]').evaluateAll((els) =>
    els.map((e) => e.getAttribute("data-testid")),
  );
  expect(order).toEqual(["field-externalId", "field-category", "field-age", "field-weight", "field-sex", "card-preview"]);
  await expect(page.getByTestId("card-preview")).toContainText("PRÉVIA DO CARD");
});

test("contador e botao desabilitado com 0 a 4 campos", async ({ page }) => {
  const counter = page.getByTestId("filled-counter");
  const steps: Array<() => Promise<void>> = [
    () => fillForm(page, { externalId: "023" }),
    () => fillForm(page, { category: "Taurino" }),
    () => fillForm(page, { age: "24" }),
    () => fillForm(page, { weight: "485" }),
  ];
  for (let filled = 0; filled <= 4; filled++) {
    await expect(counter).toHaveText(`${filled} de 5 preenchidos`);
    await expect(saveButton(page)).toBeDisabled();
    await expect(saveButton(page)).toHaveCSS("background-color", rgb("#EEF0EF"));
    await expect(saveButton(page)).toHaveCSS("color", rgb("#9AA39E"));
    if (filled < 4) await steps[filled]();
  }
});

test("cinco de cinco habilita salvar", async ({ page }) => {
  await fillForm(page, complete);
  const counter = page.getByTestId("filled-counter");
  await expect(counter).toHaveText(/5 de 5 preenchidos/);
  await expect(counter.locator('[data-icon="check_circle"]')).toBeVisible();
  await expect(counter).toHaveCSS("color", rgb("#18864B"));
  await expect(saveButton(page)).toBeEnabled();
  await expect(saveButton(page)).toHaveCSS("background-color", rgb("#1F6B45"));
});

test("cartoes de categoria", async ({ page }) => {
  const taurino = page.getByRole("button", { name: /Taurino/ });
  const zebu = page.getByRole("button", { name: /Zebu/ });
  await expect(taurino).toContainText("Sem cupim");
  await expect(zebu).toContainText("Com cupim");
  await taurino.click();
  await expect(taurino).toHaveCSS("border-top-color", rgb("#1F6B45"));
  await expect(taurino.getByTestId("category-check")).toBeVisible();
  await expect(zebu.getByTestId("category-check")).toHaveCount(0);
});

test("botoes de sexo com icones", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Macho" }).locator('[data-icon="male"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Fêmea" }).locator('[data-icon="female"]')).toBeVisible();
});

test("idade com unidade e conversao", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Meses" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Anos" })).toHaveAttribute("aria-pressed", "false");
  await fillForm(page, { age: "24" });
  await expect(page.getByTestId("field-age")).toContainText("meses");
  await expect(page.getByTestId("age-conversion")).toHaveText("= 2 anos");
});

test("peso com kg dentro do campo", async ({ page }) => {
  await expect(page.getByTestId("field-weight").getByText("kg", { exact: true })).toBeVisible();
});

test("previa do card", async ({ page }) => {
  await fillForm(page, complete);
  const preview = page.getByTestId("card-preview");
  await expect(preview).toContainText("Animal #023");
  await expect(preview).toContainText("Taurino • Macho");
  await expect(preview).toContainText("24 meses • 485 kg");
});

test("peso fora da faixa nao envia", async ({ page }) => {
  let posted = false;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/animals") && r.method() === "POST") posted = true;
  });
  await fillForm(page, { ...complete, weight: "29" });
  await saveButton(page).click();
  await expect(page.getByTestId("field-weight")).toContainText("Confira o peso informado");
  await expect(page).toHaveURL(/\/animais\/novo$/);
  expect(posted).toBe(false);
});

test("identificacao duplicada mostra o erro no campo", async ({ page, request }) => {
  await createAnimal(request, { externalId: "A12" });
  await fillForm(page, { ...complete, externalId: "a12 " });
  await saveButton(page).click();
  await expect(page.getByTestId("field-externalId")).toContainText("Já existe um animal com este ID.");
  await expect(page).toHaveURL(/\/animais\/novo$/);
});

test("erro so ao sair do campo", async ({ page }) => {
  const weight = page.getByLabel("Peso");
  await weight.fill("1501");
  await expect(page.getByTestId("field-weight").getByRole("alert")).toHaveCount(0);
  await weight.blur();
  const alert = page.getByTestId("field-weight").getByRole("alert");
  await expect(alert).toHaveText(/Confira o peso informado/);
  await expect(alert.locator('[data-icon="error"]')).toBeVisible();
  await expect(alert).toHaveCSS("color", rgb("#B23E2F"));
});

test("teclado numerico em idade e peso", async ({ page }) => {
  await expect(page.getByLabel("Idade", { exact: true })).toHaveAttribute("inputmode", "numeric");
  await expect(page.getByLabel("Peso")).toHaveAttribute("inputmode", "numeric");
});

test("offline desabilita salvar", async ({ page, context }) => {
  await fillForm(page, complete);
  await context.setOffline(true);
  await expect(saveButton(page)).toBeDisabled();
  await expect(page.getByText("Sem internet — conecte-se para salvar.")).toBeVisible();
  await context.setOffline(false);
});
