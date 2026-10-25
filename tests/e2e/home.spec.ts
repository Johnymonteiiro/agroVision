import { expect, test } from "@playwright/test";
import { fakeClassifier, resetDb, rgb } from "./helpers";

test.beforeEach(async () => {
  await resetDb();
});

const nav = "nav[aria-label='Navegação principal']";

test("raiz abre a home", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Analisar animal" })).toBeVisible();
  await expect(page).toHaveURL(/^http:\/\/[^/]+\/$/);
  await expect(page.getByRole("heading", { name: "Animais" })).toHaveCount(0);
});

test("topo da home", async ({ page }) => {
  await page.goto("/");
  const logo = page.getByTestId("home-logo");
  expect(Math.round((await logo.boundingBox())!.width)).toBe(36);
  const title = page.getByRole("heading", { name: "AgroVision", level: 1 });
  await expect(title).toHaveCSS("font-size", "18px");
  await expect(title).toHaveCSS("font-weight", "700");
  const titleBox = (await title.boundingBox())!;
  const chipBox = (await page.getByTestId("connection-chip").boundingBox())!;
  expect(chipBox.x).toBeGreaterThan(titleBox.x + titleBox.width);
});

test("chip online", async ({ page }) => {
  await page.goto("/");
  const chip = page.getByTestId("connection-chip");
  await expect(chip).toHaveText("Online");
  await expect(chip).toHaveCSS("background-color", rgb("#EAF5EF"));
  await expect(chip).toHaveCSS("color", rgb("#154C35"));
  await expect(chip.getByTestId("online-dot")).toHaveCSS("background-color", rgb("#18864B"));
});

test("chip offline", async ({ page, context }) => {
  await page.goto("/");
  await context.setOffline(true);
  const chip = page.getByTestId("connection-chip");
  await expect(chip).toContainText("Offline");
  await expect(chip.locator('[data-icon="cloud_off"]')).toBeVisible();
  await expect(chip).toHaveCSS("background-color", rgb("#EEF0EF"));
  await expect(chip).toHaveCSS("color", rgb("#3C4641"));
  await context.setOffline(false);
});

test("cartao analisar animal", async ({ page }) => {
  await page.goto("/");
  const intro = page.getByText("Analise um animal usando a câmera ou uma foto.");
  const heading = page.getByRole("heading", { name: "Analisar animal" });
  expect((await intro.boundingBox())!.y).toBeLessThan((await heading.boundingBox())!.y);
  await expect(heading).toHaveCSS("font-size", "26px");
  await expect(heading).toHaveCSS("font-weight", "700");
  await expect(page.getByText("Tire uma foto ou selecione uma imagem")).toBeVisible();
  const shoot = page.getByRole("link", { name: "Tirar foto" });
  expect(Math.round((await shoot.boundingBox())!.height)).toBe(60);
  await expect(shoot).toHaveCSS("background-color", rgb("#1F6B45"));
  const gallery = page.getByRole("button", { name: "Escolher da galeria" });
  expect(Math.round((await gallery.boundingBox())!.height)).toBe(56);
  await expect(gallery).toHaveCSS("background-color", rgb("#EAF5EF"));
});

test("sem modelo na home", async ({ page }) => {
  await page.goto("/");
  const status = page.getByTestId("model-status");
  await expect(status).toHaveText(/Modelo de IA ainda não disponível/);
  await expect(status.locator('[data-icon="offline_bolt"]')).toHaveCSS("color", rgb("#68736D"));
  await expect(page.getByText("IA disponível offline")).toHaveCount(0);
});

test("modelo instalado na home", async ({ page }) => {
  await fakeClassifier(page, { version: "1.4.0" });
  await page.goto("/");
  const status = page.getByTestId("model-status");
  await expect(status).toContainText("IA disponível offline");
  await expect(status).toContainText("Modelo instalado: v1.4.0");
});

test("aba home", async ({ page, request }) => {
  await page.goto("/");
  const home = page.locator(nav).getByRole("link", { name: "Home" });
  await expect(home).toHaveAttribute("aria-current", "page");
  await expect(home).toHaveAttribute("href", "/");
  await page.goto("/animais");
  await page.locator(nav).getByRole("link", { name: "Home" }).click();
  await expect(page).toHaveURL(/^http:\/\/[^/]+\/$/);
  expect((await request.get("/inicio")).status()).toBe(404);
});
