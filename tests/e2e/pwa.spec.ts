import { expect, test, type Page } from "@playwright/test";
import { resetDb } from "./helpers";

test.beforeEach(async () => {
  await resetDb();
});

// Simula o `beforeinstallprompt` do Chromium; o headless não o dispara sozinho (exige engajamento).
async function offerInstall(page: Page) {
  const banner = page.getByRole("region", { name: "Instalar app" });
  // O listener é registrado quando o bundle do cliente carrega; repete até ele existir.
  await expect(async () => {
    await page.evaluate(() => {
      const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
        prompt: () => {
          (window as unknown as Record<string, unknown>).__prompted = true;
          return Promise.resolve();
        },
        userChoice: Promise.resolve({ outcome: "accepted" }),
      });
      window.dispatchEvent(event);
    });
    await expect(banner).toBeVisible({ timeout: 500 });
  }).toPass();
  return banner;
}

// `Page.getInstallabilityErrors` volta vazio até sem manifest no Chromium atual; `getAppManifest` não.
test("chromium le o manifest sem erros", async ({ page }) => {
  await page.goto("/animais");
  const cdp = await page.context().newCDPSession(page);
  const manifest = await cdp.send("Page.getAppManifest", {});
  expect(manifest.url).toMatch(/\/app\.webmanifest$/);
  expect(manifest.errors).toEqual([]);
  expect(manifest.data).toBeTruthy();
});

test("manifest com identidade e icones", async ({ page, request }) => {
  await page.goto("/animais");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  const manifest = await (await request.get(href!)).json();
  expect(manifest).toMatchObject({
    id: "/",
    name: "AgroVision",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "pt-BR",
  });
  expect(manifest.icons.map((i: { sizes: string; purpose: string }) => `${i.sizes} ${i.purpose}`)).toEqual([
    "192x192 any",
    "512x512 any",
    "512x512 maskable",
  ]);
  for (const icon of manifest.icons) {
    const res = await request.get(icon.src);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/png");
    // Largura e altura ficam nos bytes 16-23 do cabeçalho IHDR do PNG.
    const png = await res.body();
    expect(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`).toBe(icon.sizes);
  }
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
});

test("banner so aparece quando o navegador oferece a instalacao", async ({ page }) => {
  await page.goto("/animais");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("region", { name: "Instalar app" })).toHaveCount(0);
});

test("instalar abre o prompt do navegador", async ({ page }) => {
  await page.goto("/animais");
  const banner = await offerInstall(page);
  await expect(banner).toContainText("Instale o app");
  await banner.getByRole("button", { name: "Instalar" }).click();
  expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).__prompted)).toBe(true);
  await expect(banner).toBeHidden();
});

test("fechar esconde o banner", async ({ page }) => {
  await page.goto("/animais");
  const banner = await offerInstall(page);
  await banner.getByRole("button", { name: "Fechar" }).click();
  await expect(banner).toBeHidden();
});

test.describe("no iPhone", () => {
  test.use({
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  });

  test("banner ensina a adicionar a tela de inicio", async ({ page }) => {
    await page.goto("/animais");
    const banner = page.getByRole("region", { name: "Instalar app" });
    await expect(banner).toContainText("Toque em Compartilhar e depois em “Adicionar à Tela de Início”.");
    await expect(banner.getByRole("button", { name: "Instalar" })).toHaveCount(0);
  });
});
