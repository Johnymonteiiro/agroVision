import { expect, test } from "@playwright/test";
import { createAnimal, resetDb, rgb } from "./helpers";

test.beforeEach(async () => {
  await resetDb();
});

const nav = "nav[aria-label='Navegação principal']";

// dataset-rotulos AC 25: Ajustes saiu da barra e Dataset entrou na última posição.
test("barra inferior com as cinco abas", async ({ page }) => {
  await page.goto("/animais");
  const bar = page.locator(nav);
  await expect(bar.getByRole("link")).toHaveCount(5);
  // Ordem pela posição na tela: cada aba à direita da anterior.
  let previousX = -1;
  for (const name of ["Home", "Histórico", "Analisar", "Animais", "Dataset"]) {
    const link = bar.getByRole("link", { name, exact: true });
    await expect(link).toBeVisible();
    const x = (await link.boundingBox())!.x;
    expect(x, `${name} à direita da aba anterior`).toBeGreaterThan(previousX);
    previousX = x;
  }
  await expect(bar.getByRole("link", { name: "Ajustes" })).toHaveCount(0);
  const current = bar.getByRole("link", { name: "Animais" });
  await expect(current).toHaveAttribute("aria-current", "page");
  await expect(current).toHaveCSS("color", rgb("#1F6B45"));
  await expect(bar.getByRole("link", { name: "Home" })).toHaveCSS("color", rgb("#68736D"));
});

test("botao central de camera elevado", async ({ page }) => {
  await page.goto("/animais");
  const center = page.locator(nav).getByRole("link", { name: "Analisar" });
  await expect(center).toHaveCSS("background-color", rgb("#1F6B45"));
  const box = (await center.boundingBox())!;
  expect(Math.round(box.width)).toBe(62);
  expect(Math.round(box.height)).toBe(62);
  const barTop = (await page.locator(nav).boundingBox())!.y;
  expect(box.y).toBeLessThan(barTop);
});

test("abas sem feature mostram em breve", async ({ page }) => {
  // Home e Analisar deixaram de ser "Em breve" com o fluxo de avaliação (fluxo-avaliacao C1, C9);
  // Ajustes saiu da barra (dataset-rotulos AC 25) e tem teste próprio abaixo.
  await page.goto("/animais");
  await page.locator(nav).getByRole("link", { name: "Histórico" }).click();
  await expect(page).toHaveURL(/\/historico$/);
  await expect(page.getByRole("heading", { name: "Histórico" })).toBeVisible();
  await expect(page.getByText("Em breve")).toBeVisible();
  await expect(page.locator(nav).getByRole("link", { name: "Histórico" })).toHaveAttribute("aria-current", "page");
});

test("aba dataset", async ({ page }) => {
  await page.goto("/animais");
  const tab = page.locator(nav).getByRole("link", { name: "Dataset" });
  await expect(tab.locator('[data-icon="dataset"]')).toBeVisible();
  await tab.click();
  await expect(page).toHaveURL(/\/dataset$/);
  const current = page.locator(nav).getByRole("link", { name: "Dataset" });
  await expect(current).toHaveAttribute("aria-current", "page");
  await expect(current).toHaveCSS("color", rgb("#1F6B45"));
});

test("ajustes em breve sem aba ativa", async ({ page }) => {
  await page.goto("/ajustes");
  await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
  await expect(page.getByText("Em breve")).toBeVisible();
  await expect(page.locator(nav)).toBeVisible();
  await expect(page.locator(nav).locator("[aria-current]")).toHaveCount(0);
});

test("cadastro, perfil e camera escondem a barra", async ({ page, request }) => {
  const animal = await createAnimal(request, { externalId: "023" });
  for (const path of [
    "/dataset/novo",
    "/dataset/categorias/nova",
    `/animais/${animal.id}`,
    `/animais/${animal.id}/fotos`,
    `/animais/${animal.id}/rotulo`,
  ]) {
    await page.goto(path);
    await expect(page.locator("main").first()).toBeVisible();
    await expect(page.locator(nav)).toHaveCount(0);
  }
});

test("barra nao cobre o fim da lista", async ({ page, request }) => {
  for (let i = 0; i < 8; i++) await createAnimal(request, { externalId: `A${i}` });
  await page.goto("/animais");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const last = (await page.getByTestId("animal-item").last().boundingBox())!;
  const barTop = (await page.locator(nav).boundingBox())!.y;
  expect(last.y + last.height).toBeLessThanOrEqual(barTop);
});
