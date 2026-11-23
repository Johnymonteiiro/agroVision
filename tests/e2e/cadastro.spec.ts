import { expect, test } from "@playwright/test";
import { createAnimal, createCategory, dbQuery, fillForm, imageRows, resetDb, rgb } from "./helpers";

test.beforeEach(async ({ page }) => {
  await resetDb();
  await page.goto("/dataset/novo");
});

const complete = {
  photo: "Lateral",
  externalId: "023",
  category: "Taurino",
  readiness: "Não pronto",
  age: "24",
  weight: "485",
  sex: "Macho",
} as const;
const saveButton = (page: import("@playwright/test").Page) => page.getByRole("button", { name: "Salvar animal" });
const isImageUpload = (r: import("@playwright/test").Request) => /\/api\/animals\/[^/]+\/images$/.test(r.url()) && r.method() === "POST";

test("salvar cria o animal, envia a foto e abre o perfil", async ({ page }) => {
  await fillForm(page, complete);
  const animal = page.waitForResponse((r) => r.url().endsWith("/api/animals") && r.request().method() === "POST");
  const image = page.waitForResponse((r) => isImageUpload(r.request()));
  await saveButton(page).click();
  expect((await animal).status()).toBe(201);
  expect((await image).status()).toBe(201);
  // O Playwright não expõe o corpo de um upload feito a partir de um arquivo escolhido; o banco diz o que foi gravado.
  // Foto da galeria não passou pelo guia ao vivo, então o enquadramento é UNAVAILABLE.
  expect(await imageRows()).toEqual([{ position: "SIDE", framing: "UNAVAILABLE" }]);
  await expect(page).toHaveURL(/\/animais\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: "Animal #023" })).toBeVisible();
  await expect(page.getByTestId("position-SIDE")).toContainText("1 foto");
  // dataset-rotulos C7: a categoria e o rótulo escolhidos ficam gravados no animal.
  expect(await dbQuery("select category_id, readiness from animals")).toEqual([
    { category_id: "00000000-0000-4000-8000-000000000001", readiness: "NOT_READY" },
  ]);
});

test("ordem dos campos e cabecalho do formulario", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Novo animal" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Fechar" }).locator('[data-icon="close"]')).toBeVisible();
  const order = await page.locator('[data-testid="form-fields"] > [data-testid]').evaluateAll((els) =>
    els.map((e) => e.getAttribute("data-testid")),
  );
  expect(order).toEqual([
    "field-photo",
    "field-externalId",
    "field-category",
    "field-readiness",
    "field-age",
    "field-weight",
    "field-sex",
    "card-preview",
  ]);
  await expect(page.getByTestId("card-preview")).toContainText("PRÉVIA DO CARD");
});

test("contador e botao desabilitado com 0 a 6 campos", async ({ page }) => {
  const counter = page.getByTestId("filled-counter");
  const steps: Array<() => Promise<void>> = [
    () => fillForm(page, { photo: "Lateral" }),
    () => fillForm(page, { externalId: "023" }),
    () => fillForm(page, { category: "Taurino" }),
    () => fillForm(page, { readiness: "Pronto" }),
    () => fillForm(page, { age: "24" }),
    () => fillForm(page, { weight: "485" }),
  ];
  for (let filled = 0; filled <= 6; filled++) {
    await expect(counter).toHaveText(`${filled} de 7 preenchidos`);
    await expect(saveButton(page)).toBeDisabled();
    await expect(saveButton(page)).toHaveCSS("background-color", rgb("#EEF0EF"));
    await expect(saveButton(page)).toHaveCSS("color", rgb("#9AA39E"));
    if (filled < 6) await steps[filled]();
  }
});

test("bloco de foto vazio com camera e galeria", async ({ page }) => {
  const field = page.getByTestId("field-photo");
  await expect(field).toContainText("Foto do animal");
  await expect(field.getByRole("button", { name: "Tirar foto" }).locator('[data-icon="photo_camera"]')).toBeVisible();
  await expect(field.getByRole("button", { name: "Galeria" }).locator('[data-icon="photo_library"]')).toBeVisible();
});

test("tirar foto escolhe a posicao antes da camera", async ({ page }) => {
  await page.getByRole("button", { name: "Tirar foto" }).click();
  const sheet = page.getByRole("dialog", { name: "Qual posição?" });
  await expect(sheet).toBeVisible();
  await expect(page.getByTestId("camera-screen")).toHaveCount(0);
  await sheet.getByRole("button", { name: "De cima" }).click();
  await expect(page.getByTestId("camera-screen")).toBeVisible();
  await expect(page.getByTestId("camera-position")).toHaveText("De cima");
  // Sem peso no formulário, a câmera ainda não sabe a distância e não mostra contador.
  await expect(page.getByTestId("min-distance")).toHaveText("Distância mínima: —");
  await expect(page.getByTestId("photo-counter")).toHaveCount(0);
  await page.getByRole("button", { name: "Cancelar" }).click();
  await expect(page.getByTestId("camera-screen")).toHaveCount(0);
});

test("foto da camera volta para o formulario", async ({ page }) => {
  await fillForm(page, { weight: "450" });
  await page.getByRole("button", { name: "Tirar foto" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Lateral" }).click();
  await expect(page.getByTestId("min-distance")).toHaveText("Distância mínima: 2,1 m");
  await expect(page.getByTestId("shutter")).toBeEnabled();
  await page.getByTestId("shutter").click();
  await page.getByRole("button", { name: "Usar foto" }).click();
  await expect(page.getByTestId("camera-screen")).toHaveCount(0);
  await expect(page.getByTestId("photo-preview")).toBeVisible();
  await expect(page.getByTestId("field-photo")).toContainText("Lateral");
});

test("trocar foto volta ao bloco vazio", async ({ page }) => {
  await fillForm(page, { photo: "De trás" });
  const field = page.getByTestId("field-photo");
  await expect(field).toContainText("Foto adicionada");
  await expect(field).toContainText("De trás");
  await field.getByRole("button", { name: "Trocar foto" }).click();
  await expect(page.getByTestId("photo-preview")).toHaveCount(0);
  await expect(page.getByTestId("filled-counter")).toHaveText("0 de 7 preenchidos");
});

test("falha no envio da foto mantem o formulario e reenvia sem duplicar", async ({ page }) => {
  await fillForm(page, complete);
  let failed = false;
  await page.route(/\/api\/animals\/[^/]+\/images$/, async (route) => {
    if (failed) return route.continue();
    failed = true;
    await route.fulfill({ status: 503, body: "{}" });
  });
  await saveButton(page).click();
  await expect(page.getByTestId("field-photo")).toContainText("O animal foi salvo, mas a foto não foi enviada.");
  await expect(page).toHaveURL(/\/dataset\/novo$/);

  const retry = page.waitForResponse((r) => r.url().endsWith("/api/animals") && r.request().method() === "POST");
  await saveButton(page).click();
  // Mesmo id do cliente: o animal já existe e volta 200, sem criar outro.
  expect((await retry).status()).toBe(200);
  await expect(page).toHaveURL(/\/animais\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("position-SIDE")).toContainText("1 foto");
});

test("sete de sete habilita salvar", async ({ page }) => {
  await fillForm(page, complete);
  const counter = page.getByTestId("filled-counter");
  await expect(counter).toHaveText(/7 de 7 preenchidos/);
  await expect(counter.locator('[data-icon="check_circle"]')).toBeVisible();
  await expect(counter).toHaveCSS("color", rgb("#18864B"));
  await expect(saveButton(page)).toBeEnabled();
  await expect(saveButton(page)).toHaveCSS("background-color", rgb("#1F6B45"));
});

test("cartoes de categoria", async ({ page, request }) => {
  await createCategory(request, "Nelore");
  await page.reload();
  const cards = page.getByTestId("field-category").getByRole("button");
  await expect(cards).toHaveCount(3);
  const [taurino, zebu, nelore] = [cards.nth(0), cards.nth(1), cards.nth(2)];
  await expect(taurino).toContainText("Taurino");
  await expect(zebu).toContainText("Zebu");
  await expect(nelore).toContainText("Nelore");
  // Grade de 2 colunas: Zebu ao lado de Taurino, Nelore na linha de baixo.
  const [bt, bz, bn] = [(await taurino.boundingBox())!, (await zebu.boundingBox())!, (await nelore.boundingBox())!];
  expect(Math.round(bz.y)).toBe(Math.round(bt.y));
  expect(bz.x).toBeGreaterThan(bt.x);
  expect(bn.y).toBeGreaterThanOrEqual(bt.y + bt.height);
  await expect(taurino).toContainText("Sem cupim");
  await expect(zebu).toContainText("Com cupim");
  // Nelore foi cadastrada sem descrição: só o placeholder da foto e o nome.
  await expect(nelore).toHaveText("foto referênciaNelore");
  await nelore.click();
  await expect(nelore).toHaveCSS("border-top-color", rgb("#1F6B45"));
  await expect(nelore.getByTestId("category-check")).toBeVisible();
  await expect(taurino.getByTestId("category-check")).toHaveCount(0);
  await expect(zebu.getByTestId("category-check")).toHaveCount(0);
});

test("cartoes de rotulo", async ({ page }) => {
  const field = page.getByTestId("field-readiness");
  const pronto = field.getByRole("button", { name: /^Pronto/ });
  const naoPronto = field.getByRole("button", { name: /^Não pronto/ });
  await expect(pronto).toContainText("Pronto para abate");
  await expect(naoPronto).toContainText("Ainda não está pronto");
  await pronto.click();
  await expect(pronto).toHaveCSS("border-top-color", rgb("#18864B"));
  await expect(pronto).toHaveCSS("background-color", rgb("#E3F3EA"));
  await expect(naoPronto).toHaveCSS("background-color", rgb("#FFFFFF"));
  await naoPronto.click();
  await expect(naoPronto).toHaveCSS("border-top-color", rgb("#C74A3A"));
  await expect(naoPronto).toHaveCSS("background-color", rgb("#FAEBE8"));
  await expect(pronto).toHaveCSS("background-color", rgb("#FFFFFF"));
});

test("previa do card com selo do rotulo", async ({ page }) => {
  const badge = page.getByTestId("card-preview").getByTestId("readiness-badge");
  await expect(badge).toHaveCount(0);
  await fillForm(page, { readiness: "Não pronto" });
  await expect(badge).toHaveText("NÃO PRONTO");
  await expect(badge).toHaveCSS("background-color", rgb("#FAEBE8"));
  await expect(badge).toHaveCSS("color", rgb("#C74A3A"));
  await fillForm(page, { readiness: "Pronto" });
  await expect(badge).toHaveText("PRONTO");
  await expect(badge).toHaveCSS("background-color", rgb("#E3F3EA"));
  await expect(badge).toHaveCSS("color", rgb("#136B3C"));
});

test("fechar volta para o dataset", async ({ page }) => {
  await page.getByRole("link", { name: "Fechar" }).click();
  await expect(page).toHaveURL(/\/dataset$/);
});

// C12 revisto em 2026-11-22: com app/loading.tsx a página sai em streaming (status 200), então o
// "não encontrado" é um soft 404 - a página do Next com a meta robots noindex.
test("animais novo cai no nao encontrado", async ({ page }) => {
  await page.goto("/animais/novo");
  await expect(page.getByText("This page could not be found.")).toBeVisible();
  await expect(page.locator('meta[name="robots"][content="noindex"]').first()).toBeAttached();
  await expect(page.getByRole("heading", { name: "Novo animal" })).toHaveCount(0);
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

test("previa do card", async ({ page, request }) => {
  await createCategory(request, "Nelore");
  await page.reload();
  await fillForm(page, complete);
  const preview = page.getByTestId("card-preview");
  await expect(preview).toContainText("Animal #023");
  await expect(preview).toContainText("Taurino • Macho");
  await expect(preview).toContainText("24 meses • 485 kg");
  // dataset-rotulos C11: o nome da categoria vem do banco, inclusive o de uma categoria cadastrada.
  await fillForm(page, { category: "Nelore", sex: "Fêmea" });
  await expect(preview).toContainText("Nelore • Fêmea");
});

test("peso fora da faixa nao envia", async ({ page }) => {
  let posted = false;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/animals") && r.method() === "POST") posted = true;
  });
  await fillForm(page, { ...complete, weight: "29" });
  await saveButton(page).click();
  await expect(page.getByTestId("field-weight")).toContainText("Confira o peso informado");
  await expect(page).toHaveURL(/\/dataset\/novo$/);
  expect(posted).toBe(false);
});

test("identificacao duplicada mostra o erro no campo", async ({ page, request }) => {
  await createAnimal(request, { externalId: "A12" });
  await fillForm(page, { ...complete, externalId: "a12 " });
  await saveButton(page).click();
  await expect(page.getByTestId("field-externalId")).toContainText("Já existe um animal com este ID.");
  await expect(page).toHaveURL(/\/dataset\/novo$/);
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
