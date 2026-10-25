import { expect, test, type Page } from "@playwright/test";
import { COW_PHOTO, assertTouchTargets, fakeClassifier, fakeDetector, resetDb, rgb } from "./helpers";

test.beforeEach(async ({ page }) => {
  await resetDb();
  await fakeDetector(page);
});

const nav = "nav[aria-label='Navegação principal']";
const ROOT = /^http:\/\/[^/]+\/$/;

async function openCamera(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "Tirar foto" }).click();
  await expect(page).toHaveURL(/\/analisar/);
  await expect(page.getByTestId("shutter")).toBeEnabled();
}

async function shoot(page: Page) {
  await page.getByTestId("shutter").click();
  await expect(page.getByTestId("review")).toBeVisible();
}

async function analyze(page: Page) {
  await page.getByRole("button", { name: "Analisar imagem" }).click();
}

async function setProbs(page: Page, ready: number, notReady: number) {
  await page.evaluate(([r, n]) => {
    (window as unknown as Record<string, unknown>).__probs = { ready: r, notReady: n };
  }, [ready, notReady]);
}

async function fromHomeGallery(page: Page, files: Parameters<import("@playwright/test").FileChooser["setFiles"]>[0]) {
  await page.goto("/");
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Escolher da galeria" }).click();
  await (await chooser).setFiles(files);
  await expect(page.getByTestId("review")).toBeVisible();
}

// S2 - captura e revisão

test("tirar foto abre a camera de avaliacao", async ({ page }) => {
  await openCamera(page);
  await expect(page.getByTestId("guide-frame")).toBeVisible();
  await expect(page.getByText("Posicione o animal inteiro dentro da área")).toBeVisible();
  await expect(page.getByTestId("tip-text")).toHaveText(["Fotografe de lado", "Boa iluminação", "Só um animal", "Corpo inteiro"]);
});

test("botao central abre a camera", async ({ page }) => {
  await page.goto("/animais");
  await page.locator(nav).getByRole("link", { name: "Analisar" }).click();
  await expect(page).toHaveURL(/\/analisar/);
  await expect(page.getByTestId("shutter")).toBeVisible();
});

test("layout da camera de avaliacao", async ({ page }) => {
  await openCamera(page);
  const vh = page.viewportSize()!.height;
  const vw = page.viewportSize()!.width;
  const cancel = (await page.getByRole("link", { name: "Cancelar" }).boundingBox())!;
  expect(cancel.x).toBeLessThan(vw / 2);
  expect(cancel.y).toBeLessThan(vh / 6);
  const chip = (await page.getByTestId("connection-chip").boundingBox())!;
  expect(chip.x).toBeGreaterThan(vw / 2);
  expect(chip.y).toBeLessThan(vh / 6);
  const gallery = (await page.getByRole("button", { name: "Galeria" }).boundingBox())!;
  const shutter = (await page.getByTestId("shutter").boundingBox())!;
  const tips = (await page.getByRole("button", { name: "Dicas" }).boundingBox())!;
  expect(Math.round(shutter.width)).toBe(88);
  expect(gallery.x).toBeLessThan(shutter.x);
  expect(tips.x).toBeGreaterThan(shutter.x + shutter.width);
  for (const b of [gallery, shutter, tips]) expect(b.y).toBeGreaterThan((vh * 2) / 3);
  await expect(page.getByTestId("camera-position")).toHaveCount(0);
  await expect(page.getByTestId("min-distance")).toHaveCount(0);
});

test("fluxo sem barra inferior", async ({ page }) => {
  await fakeClassifier(page, { holdClassify: true });
  await openCamera(page);
  await expect(page.locator(nav)).toHaveCount(0);
  await shoot(page);
  await expect(page.locator(nav)).toHaveCount(0);
  await analyze(page);
  await expect(page.getByText("Analisando animal...")).toBeVisible();
  await expect(page.locator(nav)).toHaveCount(0);
  await page.evaluate(() => (window as unknown as { __releaseClassify: () => void }).__releaseClassify());
  await expect(page.getByTestId("decision-block")).toBeVisible();
  await expect(page.locator(nav)).toHaveCount(0);
});

test("galeria da home vai para a revisao", async ({ page }) => {
  await page.goto("/");
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Escolher da galeria" }).click();
  const fc = await chooser;
  expect(await fc.element().getAttribute("accept")).toBe("image/*");
  await fc.setFiles(COW_PHOTO);
  await expect(page).toHaveURL(/\/analisar/);
  await expect(page.getByTestId("review")).toBeVisible();
  await expect(page.getByTestId("review-photo")).toHaveAttribute("src", /^blob:/);
});

test("galeria da camera vai para a revisao", async ({ page }) => {
  await openCamera(page);
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Galeria" }).click();
  const fc = await chooser;
  expect(await fc.element().getAttribute("accept")).toBe("image/*");
  await fc.setFiles(COW_PHOTO);
  await expect(page.getByTestId("review")).toBeVisible();
  await expect(page.getByTestId("review-photo")).toHaveAttribute("src", /^blob:/);
});

test("permissao negada mantem a galeria", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("negado", "NotAllowedError"));
  });
  await page.goto("/analisar");
  await expect(page.getByText("Permita o acesso à câmera nas configurações do navegador")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Galeria" }).click();
  await (await chooser).setFiles(COW_PHOTO);
  await expect(page.getByTestId("review")).toBeVisible();
});

test("layout da revisao de avaliacao", async ({ page }) => {
  await openCamera(page);
  await shoot(page);
  await expect(page.getByTestId("review-photo")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Esta foto está boa para análise?" })).toBeVisible();
  const go = page.getByRole("button", { name: "Analisar imagem" });
  expect(Math.round((await go.boundingBox())!.height)).toBe(60);
  await expect(go.locator('[data-icon="center_focus_strong"]')).toBeVisible();
  await expect(go).toHaveCSS("background-color", rgb("#1F6B45"));
  const retake = page.getByRole("button", { name: "Tirar outra foto" });
  expect(Math.round((await retake.boundingBox())!.height)).toBe(56);
  await expect(retake).toHaveCSS("background-color", rgb("#EAF5EF"));
  await expect(page.getByText("A análise é realizada no seu dispositivo.")).toBeVisible();
  await expect(page.getByText("Sem internet — a análise continuará normalmente.")).toHaveCount(0);
});

test("revisao offline", async ({ page, context }) => {
  await openCamera(page);
  await shoot(page);
  await context.setOffline(true);
  await expect(page.getByText("Sem internet — a análise continuará normalmente.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Analisar imagem" })).toBeEnabled();
  await context.setOffline(false);
});

test("tirar outra volta para a camera", async ({ page }) => {
  await openCamera(page);
  await shoot(page);
  await page.getByRole("button", { name: "Tirar outra foto" }).click();
  await expect(page.getByTestId("review")).toHaveCount(0);
  await expect(page.getByTestId("shutter")).toBeEnabled();
});

test("cancelar volta para a origem", async ({ page }) => {
  await openCamera(page);
  await page.getByRole("link", { name: "Cancelar" }).click();
  await expect(page).toHaveURL(ROOT);

  await page.goto("/analisar");
  await page.getByRole("link", { name: "Cancelar" }).click();
  await expect(page).toHaveURL(ROOT);

  await page.goto("/animais");
  await page.locator(nav).getByRole("link", { name: "Analisar" }).click();
  await page.getByRole("link", { name: "Cancelar" }).click();
  await expect(page).toHaveURL(/\/animais$/);
});

test("nenhuma chamada a api", async ({ page }) => {
  await fakeClassifier(page);
  const api: string[] = [];
  page.on("request", (r) => {
    const path = new URL(r.url()).pathname;
    if (path.startsWith("/api/")) api.push(`${r.method()} ${path}`);
  });
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  await expect(page.getByTestId("decision-block")).toBeVisible();
  await fromHomeGallery(page, COW_PHOTO);
  await analyze(page);
  await expect(page.getByTestId("decision-block")).toBeVisible();
  expect(api).toEqual([]);
});

// S3 - análise e resultado

test("tela analisando", async ({ page }) => {
  await fakeClassifier(page, { holdClassify: true });
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  const screen = page.getByTestId("analyzing");
  await expect(screen.getByRole("heading", { name: "Analisando animal..." })).toBeVisible();
  await expect(screen.getByText("A inteligência artificial está processando a imagem no seu dispositivo.")).toBeVisible();
  await expect(screen.getByTestId("analyzing-photo")).toBeVisible();
  await expect(screen.getByTestId("scan-line")).toBeVisible();
  await expect(screen.getByTestId("indeterminate-bar")).toBeVisible();
  await expect(screen).not.toContainText("%");
});

test("carregando modelo", async ({ page }) => {
  await fakeClassifier(page, { load: "pending" });
  await page.goto("/analisar");
  await expect(page.getByTestId("shutter")).toBeEnabled();
  await shoot(page);
  await analyze(page);
  await expect(page.getByText("Carregando modelo...")).toBeVisible();
  await expect(page.getByText("Só na primeira abertura.")).toBeVisible();
  await page.evaluate(() => (window as unknown as { __releaseModel: () => void }).__releaseModel());
  await expect(page.getByTestId("decision-block")).toContainText("PRONTO PARA ABATE");
});

test("sem modelo nao inventa resultado", async ({ page }) => {
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  const screen = page.getByTestId("model-unavailable");
  await expect(screen.getByText("Modelo de IA ainda não disponível")).toBeVisible();
  await expect(
    screen.getByText("A avaliação Pronto / Não pronto chega quando o modelo for treinado com as fotos do dataset."),
  ).toBeVisible();
  const main = page.locator("main");
  await expect(main).not.toContainText("PRONTO");
  await expect(main).not.toContainText("INCONCLUSIVO");
  await expect(main).not.toContainText("%");
  await screen.getByRole("link", { name: "Voltar ao início" }).click();
  await expect(page).toHaveURL(ROOT);
});

test("erro ao carregar o modelo", async ({ page }) => {
  await fakeClassifier(page, { load: "fail" });
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  await expect(page.getByText("Erro ao carregar o modelo")).toBeVisible();
  await expect(page.getByText("Reinicie o app. Se persistir, reinstale o modelo com internet.")).toBeVisible();
  await page.evaluate(() => ((window as unknown as Record<string, unknown>).__failLoad = false));
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByTestId("decision-block")).toBeVisible();
});

test("imagem que nao decodifica", async ({ page }) => {
  await fakeClassifier(page);
  await fromHomeGallery(page, { name: "quebrada.jpg", mimeType: "image/jpeg", buffer: Buffer.from("isto não é uma imagem") });
  await analyze(page);
  await expect(page.getByText("Não foi possível processar esta imagem")).toBeVisible();
  await expect(page.getByText("Tente outra foto.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tirar outra foto" })).toBeVisible();
});

test("resultado pronto", async ({ page }) => {
  await fakeClassifier(page, { ready: 0.914, notReady: 0.086 });
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  const block = page.getByTestId("decision-block");
  await expect(block).toHaveCSS("background-color", rgb("#18864B"));
  await expect(block.locator('[data-icon="check_circle"]')).toBeVisible();
  await expect(block).toContainText("PRONTO PARA ABATE");
  await expect(page.getByTestId("confidence")).toHaveText(/91%\s*de confiança/);
  const fill = page.getByTestId("confidence-fill");
  await expect(fill).toHaveCSS("background-color", rgb("#18864B"));
  await expect(fill).toHaveAttribute("style", /width:\s*91%/);
});

test("resultado nao pronto", async ({ page }) => {
  await fakeClassifier(page, { ready: 0.06, notReady: 0.94 });
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  const block = page.getByTestId("decision-block");
  await expect(block).toHaveCSS("background-color", rgb("#C74A3A"));
  await expect(block.locator('[data-icon="cancel"]')).toBeVisible();
  await expect(block).toContainText("NÃO PRONTO PARA ABATE");
  await expect(page.getByTestId("confidence")).toContainText("94%");
  await expect(page.getByTestId("confidence-fill")).toHaveCSS("background-color", rgb("#C74A3A"));
});

test("resultado inconclusivo", async ({ page }) => {
  await fakeClassifier(page, { ready: 0.62, notReady: 0.38 });
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  const block = page.getByTestId("decision-block");
  await expect(block).toHaveCSS("background-color", rgb("#E8A93A"));
  await expect(block).toHaveCSS("color", rgb("#2E2206"));
  await expect(block.locator('[data-icon="help"]')).toBeVisible();
  await expect(block).toContainText("RESULTADO INCONCLUSIVO");
  await expect(page.getByTestId("threshold-mark")).toBeVisible();
  await expect(page.getByText("mínimo 85%")).toBeVisible();
  await expect(
    page.getByText("A IA não conseguiu determinar o resultado com confiança suficiente. Uma nova foto costuma resolver."),
  ).toBeVisible();
  await expect(page.getByTestId("inconclusive-tips").getByTestId("inconclusive-tip")).toHaveText([
    "Tire outra foto com o animal inteiro visível.",
    "Evite sombras fortes.",
    "Fotografe o animal lateralmente.",
  ]);
});

test("inconclusivo tira outra foto", async ({ page }) => {
  await fakeClassifier(page, { ready: 0.62, notReady: 0.38 });
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  const primary = page.getByRole("button", { name: "Tirar outra foto" });
  await expect(primary).toHaveAttribute("data-primary-action", "");
  await expect(primary).toHaveCSS("background-color", rgb("#1F6B45"));
  await primary.click();
  await expect(page.getByTestId("shutter")).toBeEnabled();
});

for (const [label, ready, notReady] of [
  ["pronto", 0.914, 0.086],
  ["nao pronto", 0.06, 0.94],
] as const) {
  test(`nova avaliacao volta para a camera (${label})`, async ({ page }) => {
    await fakeClassifier(page, { ready, notReady });
    await openCamera(page);
    await shoot(page);
    await analyze(page);
    const primary = page.getByRole("button", { name: "Nova avaliação" });
    await expect(primary).toHaveAttribute("data-primary-action", "");
    await expect(primary).toHaveCSS("background-color", rgb("#1F6B45"));
    await primary.click();
    await expect(page.getByTestId("shutter")).toBeEnabled();
  });
}

test("dados do resultado", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-25T09:42:00-03:00"));
  await fakeClassifier(page);
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  const photo = page.getByTestId("result-photo");
  await expect(photo).toHaveAttribute("src", /^blob:/);
  expect((await photo.boundingBox())!.y).toBeLessThan(10);
  await expect(page.getByTestId("result-model")).toHaveText(/Modelo\s*CattleClassifier v1\.4\.0/);
  await expect(page.getByTestId("result-date")).toHaveText(/Data\s*25 out 2026, 09:42/);
  await expect(page.getByText("Este resultado é uma estimativa gerada pelo modelo de IA.")).toBeVisible();
  const close = page.getByRole("link", { name: "Fechar" });
  await expect(close.locator('[data-icon="close"]')).toBeVisible();
  await close.click();
  await expect(page).toHaveURL(ROOT);
});

test("vocabulario proibido", async ({ page }) => {
  await fakeClassifier(page, { holdClassify: true });
  const texts: string[] = [];
  const grab = async () => texts.push(await page.locator("body").innerText());
  await page.goto("/");
  await grab();
  await page.getByRole("link", { name: "Tirar foto" }).click();
  await expect(page.getByTestId("shutter")).toBeEnabled();
  await grab();
  for (const [ready, notReady] of [
    [0.914, 0.086],
    [0.06, 0.94],
    [0.62, 0.38],
  ]) {
    await setProbs(page, ready, notReady);
    await shoot(page);
    await grab();
    await analyze(page);
    await expect(page.getByTestId("analyzing")).toBeVisible();
    await grab();
    await page.evaluate(() => (window as unknown as { __releaseClassify: () => void }).__releaseClassify());
    await expect(page.getByTestId("decision-block")).toBeVisible();
    await grab();
    const again = ready === 0.62 ? "Tirar outra foto" : "Nova avaliação";
    await page.getByRole("button", { name: again }).click();
    await expect(page.getByTestId("shutter")).toBeEnabled();
  }
  for (const t of texts) expect(t).not.toMatch(/autorizad|aprovad/i);
});

test("areas de toque do fluxo", async ({ page }) => {
  await fakeClassifier(page);
  await page.goto("/");
  await assertTouchTargets(page);
  await page.getByRole("link", { name: "Tirar foto" }).click();
  await expect(page.getByTestId("shutter")).toBeEnabled();
  await assertTouchTargets(page);
  await shoot(page);
  await assertTouchTargets(page);
  await analyze(page);
  await expect(page.getByTestId("decision-block")).toBeVisible();
  await assertTouchTargets(page);
});
