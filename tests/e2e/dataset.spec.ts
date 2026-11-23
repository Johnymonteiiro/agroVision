import { expect, test, type Page } from "@playwright/test";
import { ZEBU_ID } from "../../modules/categories/seed";
import { assertTouchTargets, createAnimal, createCategory, dbQuery, resetDb, rgb, setReadiness, uploadPhoto } from "./helpers";

test.beforeEach(async () => {
  await resetDb();
});

const summaryCard = (page: Page, readiness: "READY" | "NOT_READY") => page.getByTestId(`summary-${readiness}`);
const filterLabels = async (page: Page) =>
  (await page.getByTestId("section-animals").getByRole("group", { name: "Filtros" }).getByRole("button").allInnerTexts()).map(
    (l) => l.trim(),
  );

test("cadastrar animal abre o formulario", async ({ page }) => {
  await page.goto("/dataset");
  await page.getByRole("link", { name: "Cadastrar animal" }).click();
  await expect(page).toHaveURL(/\/dataset\/novo$/);
  await expect(page.getByRole("heading", { name: "Novo animal" })).toBeVisible();
});

test("cabecalho e ordem das secoes", async ({ page, request }) => {
  const a = await createAnimal(request, { externalId: "A1" });
  await uploadPhoto(request, a.id, "SIDE");
  await page.goto("/dataset");
  await expect(page.getByTestId("dataset-totals")).toHaveText("1 animal · 1 foto");

  const b = await createAnimal(request, { externalId: "B1" });
  await uploadPhoto(request, b.id, "SIDE");
  await uploadPhoto(request, b.id, "REAR");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Dataset", level: 1 })).toBeVisible();
  await expect(page.getByTestId("dataset-totals")).toHaveText("2 animais · 3 fotos");

  const button = page.getByRole("link", { name: "Cadastrar animal" });
  await expect(button).toHaveCSS("background-color", rgb("#1F6B45"));
  await expect(button.locator('[data-icon="add"]')).toBeVisible();

  const y = async (locator: ReturnType<Page["locator"]>) => (await locator.boundingBox())!.y;
  const order = [
    await y(page.getByRole("heading", { name: "Dataset", level: 1 })),
    await y(page.getByTestId("dataset-totals")),
    await y(button),
    await y(page.getByRole("heading", { name: "Resumo", level: 2 })),
    await y(page.getByRole("heading", { name: "Categorias", level: 2 })),
    await y(page.getByRole("heading", { name: "Animais", level: 2 })),
  ];
  expect([...order].sort((p, q) => p - q)).toEqual(order);
});

test("dataset vazio", async ({ page }) => {
  await page.goto("/dataset");
  await expect(page.getByTestId("section-summary")).toContainText("Nenhuma foto ainda");
  await expect(summaryCard(page, "READY")).toHaveCount(0);
  await expect(summaryCard(page, "NOT_READY")).toHaveCount(0);
  await expect(page.getByTestId("section-animals")).toContainText("Nenhum animal cadastrado");
});

test("resumo por rotulo e categoria", async ({ page, request }) => {
  const t1 = await createAnimal(request, { externalId: "T1", readiness: "NOT_READY" });
  await uploadPhoto(request, t1.id, "SIDE");
  await uploadPhoto(request, t1.id, "REAR");
  const z1 = await createAnimal(request, { externalId: "Z1", categoryId: ZEBU_ID, readiness: "NOT_READY" });
  await uploadPhoto(request, z1.id, "SIDE");
  const t2 = await createAnimal(request, { externalId: "T2", readiness: "READY" });
  await uploadPhoto(request, t2.id, "TOP");
  await page.goto("/dataset");

  const notReady = summaryCard(page, "NOT_READY");
  await expect(notReady.getByTestId("summary-title")).toHaveText("NÃO PRONTO");
  await expect(notReady.getByTestId("summary-title")).toHaveCSS("color", rgb("#C74A3A"));
  await expect(notReady.getByTestId("summary-total")).toHaveText("3 fotos");
  await expect(notReady.getByTestId("summary-parts")).toHaveText("Taurino 2 · Zebu 1");

  const ready = summaryCard(page, "READY");
  await expect(ready.getByTestId("summary-title")).toHaveText("PRONTO");
  await expect(ready.getByTestId("summary-title")).toHaveCSS("color", rgb("#18864B"));
  await expect(ready.getByTestId("summary-total")).toHaveText("1 foto");
  await expect(ready.getByTestId("summary-parts")).toHaveText("Taurino 1");
});

test("resumo conta o rotulo da captura", async ({ page, request }) => {
  const animal = await createAnimal(request, { externalId: "G1", readiness: "NOT_READY" });
  await uploadPhoto(request, animal.id, "SIDE");
  await uploadPhoto(request, animal.id, "REAR");
  await setReadiness(request, animal.id, "READY", "FROM_NOW");
  await uploadPhoto(request, animal.id, "TOP");
  await page.goto("/dataset");
  await expect(summaryCard(page, "NOT_READY").getByTestId("summary-total")).toHaveText("2 fotos");
  await expect(summaryCard(page, "READY").getByTestId("summary-total")).toHaveText("1 foto");
});

test("lista de categorias", async ({ page, request }) => {
  await createAnimal(request, { externalId: "T1" });
  await createCategory(request, "Nelore");
  await page.goto("/dataset");
  const items = page.getByTestId("category-item");
  const texts = (await items.allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  expect(texts).toEqual(["Taurino · Sem cupim 1 animal", "Zebu · Com cupim 0 animais", "Nelore 0 animais"]);
  // "+ Nova" na linha do título da seção.
  const title = (await page.getByRole("heading", { name: "Categorias", level: 2 }).boundingBox())!;
  const add = (await page.getByRole("link", { name: "+ Nova" }).boundingBox())!;
  expect(add.y).toBeLessThan(title.y + title.height);
  expect(add.y + add.height).toBeGreaterThan(title.y);
  expect(add.x).toBeGreaterThan(title.x + title.width);
});

test("filtros da lista do dataset", async ({ page, request }) => {
  await createAnimal(request, { externalId: "A", readiness: "READY" });
  await createAnimal(request, { externalId: "B", categoryId: ZEBU_ID, readiness: "NOT_READY" });
  await page.goto("/dataset");
  const section = page.getByTestId("section-animals");
  await expect(section.getByPlaceholder("Buscar brinco ou ID")).toBeVisible();
  expect(await filterLabels(page)).toEqual(["Todos", "Pronto", "Não pronto", "Taurino", "Zebu"]);
  const expected: Array<[string, string[]]> = [
    ["Pronto", ["Animal #A"]],
    ["Não pronto", ["Animal #B"]],
    ["Taurino", ["Animal #A"]],
    ["Zebu", ["Animal #B"]],
    ["Todos", ["Animal #B", "Animal #A"]],
  ];
  for (const [chip, titles] of expected) {
    await section.getByRole("button", { name: chip, exact: true }).click();
    const items = section.getByTestId("animal-item");
    await expect(items).toHaveCount(titles.length);
    for (const [i, title] of titles.entries()) await expect(items.nth(i)).toContainText(title);
  }
});

test("selo do rotulo na lista do dataset", async ({ page, request }) => {
  await createAnimal(request, { externalId: "R1", readiness: "READY" });
  await createAnimal(request, { externalId: "N1", readiness: "NOT_READY" });
  await page.goto("/dataset");
  const items = page.getByTestId("section-animals").getByTestId("animal-item");
  const ready = items.filter({ hasText: "Animal #R1" }).getByTestId("readiness-badge");
  const notReady = items.filter({ hasText: "Animal #N1" }).getByTestId("readiness-badge");
  await expect(ready).toHaveText("PRONTO");
  await expect(ready).toHaveCSS("background-color", rgb("#E3F3EA"));
  await expect(ready).toHaveCSS("color", rgb("#136B3C"));
  await expect(notReady).toHaveText("NÃO PRONTO");
  await expect(notReady).toHaveCSS("background-color", rgb("#FAEBE8"));
  await expect(notReady).toHaveCSS("color", rgb("#C74A3A"));
});

test("nova categoria abre o formulario", async ({ page }) => {
  await page.goto("/dataset");
  await page.getByRole("link", { name: "+ Nova" }).click();
  await expect(page).toHaveURL(/\/dataset\/categorias\/nova$/);
  await expect(page.getByRole("heading", { name: "Nova categoria" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Fechar" }).locator('[data-icon="close"]')).toBeVisible();
  await expect(page.getByLabel("Nome", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Descrição (opcional)")).toBeVisible();
  const save = page.getByRole("button", { name: "Salvar categoria" });
  expect(Math.round((await save.boundingBox())!.height)).toBe(58);
});

test("salvar categoria volta para o dataset", async ({ page }) => {
  await page.goto("/dataset/categorias/nova");
  await page.getByLabel("Nome", { exact: true }).fill("Nelore");
  await page.getByLabel("Descrição (opcional)").fill("Cruzado zebuíno");
  await page.getByRole("button", { name: "Salvar categoria" }).click();
  await expect(page).toHaveURL(/\/dataset$/);
  await expect(page.getByTestId("category-item").filter({ hasText: "Nelore" })).toContainText("Nelore · Cruzado zebuíno");
});

test("categoria nova no formulario e nos filtros", async ({ page, request }) => {
  // As listas só mostram filtros com algum animal cadastrado.
  await createAnimal(request, { externalId: "T1" });
  await page.goto("/dataset/categorias/nova");
  await page.getByLabel("Nome", { exact: true }).fill("Nelore");
  await page.getByRole("button", { name: "Salvar categoria" }).click();
  await expect(page).toHaveURL(/\/dataset$/);
  await expect(
    page.getByTestId("section-animals").getByRole("group", { name: "Filtros" }).getByRole("button", { name: "Nelore", exact: true }),
  ).toBeVisible();

  await page.goto("/dataset/novo");
  await expect(page.getByTestId("field-category").getByRole("button", { name: /^foto referência\s*Nelore/ })).toBeVisible();

  await page.goto("/animais");
  await expect(page.getByRole("group", { name: "Filtros" }).getByRole("button", { name: "Nelore", exact: true })).toBeVisible();
});

test("nome vazio mostra erro no campo", async ({ page }) => {
  await page.goto("/dataset/categorias/nova");
  await page.getByLabel("Nome", { exact: true }).fill("   ");
  await page.getByRole("button", { name: "Salvar categoria" }).click();
  await expect(page.getByTestId("field-name").getByRole("alert")).toHaveText(/Informe um nome de até 30 caracteres/);
  await expect(page).toHaveURL(/\/dataset\/categorias\/nova$/);
});

test("nome duplicado mostra erro no campo", async ({ page, request }) => {
  await createCategory(request, "Nelore");
  await page.goto("/dataset/categorias/nova");
  await page.getByLabel("Nome", { exact: true }).fill("nelore ");
  await page.getByRole("button", { name: "Salvar categoria" }).click();
  await expect(page.getByTestId("field-name").getByRole("alert")).toHaveText(/Já existe uma categoria com este nome\./);
  await expect(page).toHaveURL(/\/dataset\/categorias\/nova$/);
  expect(await dbQuery("select count(*)::int as n from categories where lower(trim(name)) = 'nelore'")).toEqual([{ n: 1 }]);
});

test("fechar nova categoria nao cria", async ({ page }) => {
  await page.goto("/dataset/categorias/nova");
  await page.getByLabel("Nome", { exact: true }).fill("Angus");
  await page.getByRole("link", { name: "Fechar" }).click();
  await expect(page).toHaveURL(/\/dataset$/);
  await expect(page.getByTestId("category-item").filter({ hasText: "Angus" })).toHaveCount(0);
  expect(await dbQuery("select count(*)::int as n from categories where name = 'Angus'")).toEqual([{ n: 0 }]);
});

test("offline desabilita salvar categoria", async ({ page, context }) => {
  await page.goto("/dataset/categorias/nova");
  await page.getByLabel("Nome", { exact: true }).fill("Nelore");
  await context.setOffline(true);
  await expect(page.getByRole("button", { name: "Salvar categoria" })).toBeDisabled();
  await expect(page.getByText("Sem internet — conecte-se para salvar.")).toBeVisible();
  await context.setOffline(false);
});

test("alvos de toque das telas novas", async ({ page, request }) => {
  await createAnimal(request, { externalId: "T1" });
  await createCategory(request, "Nelore");
  await page.goto("/dataset");
  await assertTouchTargets(page);
  await page.goto("/dataset/categorias/nova");
  await assertTouchTargets(page);
  await page.goto("/");
  const gear = (await page.getByRole("link", { name: "Ajustes" }).boundingBox())!;
  expect(gear.width).toBeGreaterThanOrEqual(44);
  expect(gear.height).toBeGreaterThanOrEqual(44);
});
