import { expect, test, type Page } from "@playwright/test";
import { createAnimal, fillForm, resetDb, rgb } from "./helpers";

async function fakeDetector(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as Record<string, unknown>).__gadoDetector = () => Promise.resolve({ detect: () => [] });
  });
}

let animalId: string;

test.beforeEach(async ({ request }) => {
  await resetDb();
  animalId = (await createAnimal(request, { externalId: "023" })).id;
});

test("tokens do design system", async ({ page }) => {
  await page.goto(`/animais/${animalId}`);
  const body = page.locator("body");
  await expect(body).toHaveCSS("background-color", rgb("#F6F8F7"));
  await expect(body).toHaveCSS("color", rgb("#17211C"));
  expect(await body.evaluate((b) => getComputedStyle(b).fontFamily)).toMatch(/Geist/);
  const icon = page.locator('[data-icon="photo_camera"]').first();
  expect(await icon.evaluate((i) => getComputedStyle(i).fontFamily)).toMatch(/Material Symbols Rounded/);
  await expect(page.getByRole("link", { name: "Fotografar animal" })).toHaveCSS("background-color", rgb("#1F6B45"));
  await expect(page.getByTestId("profile-card").locator("p").nth(1)).toHaveCSS("color", rgb("#68736D"));
  const iconsLoaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('24px "Material Symbols Rounded"');
  });
  expect(iconsLoaded).toBe(true);
});

test("fontes servidas localmente", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(r.url())) external.push(r.url());
  });
  await fakeDetector(page);
  for (const path of ["/animais", "/animais/novo", `/animais/${animalId}`, `/animais/${animalId}/fotos`, `/animais/${animalId}/fotos/lateral`]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  expect(external).toEqual([]);
});

async function assertTouchTargets(page: Page) {
  const report = await page.evaluate(() => {
    const els = [...document.querySelectorAll<HTMLElement>("a, button, input")].filter((el) => el.offsetParent !== null);
    return els.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        label: el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 30) ?? el.tagName,
        w: Math.round(r.width),
        h: Math.round(r.height),
        primary: el.hasAttribute("data-primary-action"),
      };
    });
  });
  for (const t of report) {
    expect.soft(t.w, `largura de "${t.label}"`).toBeGreaterThanOrEqual(44);
    expect.soft(t.h, `altura de "${t.label}"`).toBeGreaterThanOrEqual(44);
    if (t.primary) {
      expect.soft(t.h, `altura da ação principal "${t.label}"`).toBeGreaterThanOrEqual(56);
      expect.soft(t.h, `altura da ação principal "${t.label}"`).toBeLessThanOrEqual(60);
    }
  }
  expect(report.length).toBeGreaterThan(0);
}

test("areas de toque", async ({ page }) => {
  await fakeDetector(page);
  await page.goto("/animais");
  await assertTouchTargets(page);
  await page.goto("/animais/novo");
  await fillForm(page, { externalId: "77", category: "Taurino", age: "24", weight: "485", sex: "Macho" });
  await assertTouchTargets(page);
  await page.goto(`/animais/${animalId}`);
  await assertTouchTargets(page);
  await page.goto(`/animais/${animalId}/fotos`);
  await assertTouchTargets(page);
  await page.goto(`/animais/${animalId}/fotos/lateral`);
  await expect(page.getByTestId("shutter")).toBeEnabled();
  await assertTouchTargets(page);
  await page.getByTestId("shutter").click();
  await expect(page.getByTestId("review")).toBeVisible();
  await assertTouchTargets(page);
});
