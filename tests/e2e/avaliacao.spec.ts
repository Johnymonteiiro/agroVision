import { expect, test, type Page } from "@playwright/test";
import { COW_PHOTO, assertTouchTargets, fakeClassifier, fakeDetector, releaseClassify, resetDb, rgb } from "./helpers";

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
  await releaseClassify(page);
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
  await expect(primary).toHaveAttribute("data-primary-action");
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
    await expect(primary).toHaveAttribute("data-primary-action");
    await expect(primary).toHaveCSS("background-color", rgb("#1F6B45"));
    await primary.click();
    await expect(page.getByTestId("shutter")).toBeEnabled();
  });
}

test("dados do resultado", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-25T09:42:00-03:00"));
  await fakeClassifier(page);
  await openCamera(page);
  for (const [ready, notReady, label] of [
    [0.914, 0.086, "PRONTO PARA ABATE"],
    [0.06, 0.94, "NÃO PRONTO PARA ABATE"],
  ] as const) {
    await setProbs(page, ready, notReady);
    await shoot(page);
    await analyze(page);
    await expect(page.getByTestId("decision-block")).toContainText(label);
    const photo = page.getByTestId("result-photo");
    await expect(photo).toHaveAttribute("src", /^blob:/);
    expect((await photo.boundingBox())!.y).toBeLessThan(10);
    await expect(page.getByTestId("result-model")).toHaveText(/Modelo\s*CattleClassifier v1\.4\.0/);
    await expect(page.getByTestId("result-date")).toHaveText(/Data\s*25 out 2026, 09:42/);
    await expect(page.getByText("Este resultado é uma estimativa gerada pelo modelo de IA.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Fechar" }).locator('[data-icon="close"]')).toBeVisible();
    if (label === "PRONTO PARA ABATE") {
      await page.getByRole("button", { name: "Nova avaliação" }).click();
      await expect(page.getByTestId("shutter")).toBeEnabled();
    }
  }
  await page.getByRole("link", { name: "Fechar" }).click();
  await expect(page).toHaveURL(ROOT);
});

// Rodada 2 - lacunas da verificação independente

test("inconclusivo sem modelo e data", async ({ page }) => {
  await fakeClassifier(page, { ready: 0.62, notReady: 0.38 });
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  await expect(page.getByTestId("decision-block")).toContainText("RESULTADO INCONCLUSIVO");
  await expect(page.getByTestId("result-photo")).toHaveAttribute("src", /^blob:/);
  await expect(page.getByRole("link", { name: "Fechar" })).toBeVisible();
  await expect(page.getByTestId("result-model")).toHaveCount(0);
  await expect(page.getByTestId("result-date")).toHaveCount(0);
  await expect(page.getByText("Este resultado é uma estimativa gerada pelo modelo de IA.")).toHaveCount(0);
});

test("voltar da revisao", async ({ page }) => {
  await openCamera(page);
  await shoot(page);
  const back = page.getByRole("button", { name: "Voltar" });
  await expect(back.locator('[data-icon="arrow_back"]')).toBeVisible();
  const b = (await back.boundingBox())!;
  const photo = (await page.getByTestId("review-photo").boundingBox())!;
  expect(Math.round(b.width)).toBe(44);
  expect(Math.round(b.height)).toBe(44);
  expect(b.x).toBeLessThan(page.viewportSize()!.width / 2);
  expect(b.y).toBeGreaterThanOrEqual(photo.y);
  expect(b.y + b.height).toBeLessThanOrEqual(photo.y + photo.height / 3);
  await back.click();
  await expect(page.getByTestId("review")).toHaveCount(0);
  await expect(page.getByTestId("shutter")).toBeEnabled();

  await fromHomeGallery(page, COW_PHOTO);
  await page.getByRole("button", { name: "Voltar" }).click();
  await expect(page.getByTestId("review")).toHaveCount(0);
  await expect(page.getByTestId("shutter")).toBeEnabled();
});

test("rodape da analise", async ({ page }) => {
  await fakeClassifier(page, { holdClassify: true });
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  const footer = page.getByTestId("analyzing").getByText("CattleClassifier v1.4.0 · no dispositivo");
  await expect(footer).toBeVisible();
  await expect(page.getByTestId("analyzing").locator('[data-icon="memory"]')).toBeVisible();
});

test("classificacao que falha", async ({ page }) => {
  await fakeClassifier(page, { classifyFails: true });
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  await expect(page.getByText("Erro ao carregar o modelo")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
});

async function expectStateClose(page: Page) {
  const close = page.getByRole("link", { name: "Fechar" });
  await expect(close.locator('[data-icon="close"]')).toBeVisible();
  const b = (await close.boundingBox())!;
  expect(Math.round(b.width)).toBe(44);
  expect(Math.round(b.height)).toBe(44);
  await close.click();
  await expect(page).toHaveURL(ROOT);
}

test("fechar nas telas de estado", async ({ page }) => {
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  await expect(page.getByTestId("model-unavailable")).toBeVisible();
  await expectStateClose(page);

  await fromHomeGallery(page, { name: "quebrada.jpg", mimeType: "image/jpeg", buffer: Buffer.from("isto não é uma imagem") });
  await analyze(page);
  await expect(page.getByTestId("image-error")).toBeVisible();
  await expectStateClose(page);

  await fakeClassifier(page, { load: "fail" });
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  await expect(page.getByTestId("model-error")).toBeVisible();
  await expectStateClose(page);
});

test("foto invalida volta para a camera", async ({ page }) => {
  await fromHomeGallery(page, { name: "quebrada.jpg", mimeType: "image/jpeg", buffer: Buffer.from("isto não é uma imagem") });
  await analyze(page);
  await page.getByTestId("image-error").getByRole("button", { name: "Tirar outra foto" }).click();
  await expect(page.getByTestId("shutter")).toBeEnabled();
});

test("cancelar recusa outro site", async ({ page }) => {
  await page.goto("/analisar?de=//evil.com");
  await expect(page.getByRole("link", { name: "Cancelar" })).toHaveAttribute("href", "/");
});

test("telas de estado sem vocabulario proibido e com toque", async ({ page }) => {
  const check = async () => {
    expect(await page.locator("body").innerText()).not.toMatch(/autorizad|aprovad/i);
    await assertTouchTargets(page);
  };
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  await expect(page.getByTestId("model-unavailable")).toBeVisible();
  await check();

  await fromHomeGallery(page, { name: "quebrada.jpg", mimeType: "image/jpeg", buffer: Buffer.from("isto não é uma imagem") });
  await analyze(page);
  await expect(page.getByTestId("image-error")).toBeVisible();
  await check();

  await fakeClassifier(page, { load: "fail" });
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  await expect(page.getByTestId("model-error")).toBeVisible();
  await check();

  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("negado", "NotAllowedError"));
  });
  await page.goto("/analisar");
  await expect(page.getByText("Permita o acesso à câmera nas configurações do navegador")).toBeVisible();
  await check();
});

test("arranjo da revisao", async ({ page }) => {
  await openCamera(page);
  await shoot(page);
  const photo = (await page.getByTestId("review-photo").boundingBox())!;
  const sheet = page.getByTestId("review-sheet");
  const s = (await sheet.boundingBox())!;
  expect(photo.y).toBeLessThan(s.y);
  expect(photo.y + photo.height).toBeLessThanOrEqual(s.y + 30);
  const ys = [];
  for (const el of [
    sheet.getByRole("heading", { name: "Esta foto está boa para análise?" }),
    sheet.getByRole("button", { name: "Analisar imagem" }),
    sheet.getByRole("button", { name: "Tirar outra foto" }),
    sheet.getByText("A análise é realizada no seu dispositivo."),
  ]) {
    ys.push((await el.boundingBox())!.y);
  }
  expect([...ys].sort((a, b) => a - b)).toEqual(ys);
});

test("arranjo da analise", async ({ page }) => {
  await fakeClassifier(page, { holdClassify: true });
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  const screen = page.getByTestId("analyzing");
  const els = [
    screen.getByTestId("analyzing-photo"),
    screen.getByRole("heading", { name: "Analisando animal..." }),
    screen.getByText("A inteligência artificial está processando a imagem no seu dispositivo."),
    screen.getByTestId("indeterminate-bar"),
  ];
  const vw = page.viewportSize()!.width;
  const ys = [];
  for (const el of els) {
    const b = (await el.boundingBox())!;
    ys.push(b.y);
    expect(Math.abs(b.x + b.width / 2 - vw / 2)).toBeLessThan(2);
  }
  expect([...ys].sort((a, b) => a - b)).toEqual(ys);
});

test("arranjo e valores do resultado", async ({ page }) => {
  await fakeClassifier(page);
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  const card = (await page.getByTestId("result-card").boundingBox())!;
  const photo = (await page.getByTestId("result-photo").boundingBox())!;
  expect(card.y).toBeLessThan(photo.y + photo.height);
  const ys = [];
  for (const el of [
    page.getByTestId("decision-block"),
    page.getByTestId("confidence"),
    page.getByTestId("confidence-fill"),
    page.getByTestId("result-model"),
    page.getByTestId("result-date"),
    page.getByRole("button", { name: "Nova avaliação" }),
    page.getByText("Este resultado é uma estimativa gerada pelo modelo de IA."),
  ]) {
    ys.push((await el.boundingBox())!.y);
  }
  expect([...ys].sort((a, b) => a - b)).toEqual(ys);

  await page.getByRole("button", { name: "Nova avaliação" }).click();
  await setProbs(page, 0.06, 0.94);
  await shoot(page);
  await analyze(page);
  await expect(page.getByTestId("confidence-fill")).toHaveAttribute("style", /width:\s*94%/);

  await page.getByRole("button", { name: "Nova avaliação" }).click();
  await setProbs(page, 0.62, 0.38);
  await shoot(page);
  await analyze(page);
  await expect(page.getByTestId("confidence")).toHaveText(/62%\s*de confiança/);
  const fill = page.getByTestId("confidence-fill");
  await expect(fill).toHaveCSS("background-color", rgb("#E8A93A"));
  const bar = (await fill.locator("..").boundingBox())!;
  const mark = (await page.getByTestId("threshold-mark").boundingBox())!;
  expect(Math.abs(mark.x - bar.x - 0.85 * bar.width)).toBeLessThan(2);
});

test("icones da home, camera e revisao", async ({ page }) => {
  await page.goto("/");
  const circle = page.getByTestId("home-card-icon");
  const c = (await circle.boundingBox())!;
  expect(Math.round(c.width)).toBe(76);
  expect(Math.round(c.height)).toBe(76);
  await expect(circle).toHaveCSS("background-color", rgb("#EAF5EF"));
  await expect(circle.locator('[data-icon="photo_camera"]')).toHaveClass(/icon-fill/);
  await expect(page.getByRole("link", { name: "Tirar foto" }).locator('[data-icon="photo_camera"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Escolher da galeria" }).locator('[data-icon="photo_library"]')).toBeVisible();

  await page.getByRole("link", { name: "Tirar foto" }).click();
  await expect(page.getByTestId("shutter")).toBeEnabled();
  await expect(page.getByRole("button", { name: "Galeria" }).locator('[data-icon="photo_library"]')).toBeVisible();
  await expect(page.getByTestId("camera-controls").getByText("Galeria", { exact: true })).toBeVisible();

  await shoot(page);
  await expect(page.getByRole("button", { name: "Tirar outra foto" }).locator('[data-icon="replay"]')).toBeVisible();
});

test("icones do resultado e dos estados", async ({ page }) => {
  await fakeClassifier(page, { ready: 0.62, notReady: 0.38 });
  await openCamera(page);
  await shoot(page);
  await analyze(page);
  await expect(page.getByRole("button", { name: "Tirar outra foto" }).locator('[data-icon="photo_camera"]')).toBeVisible();
  const tips = page.getByTestId("inconclusive-tips");
  await expect(tips).toHaveCSS("background-color", rgb("#FBF4E6"));
  expect(await tips.locator("[data-icon]").evaluateAll((els) => els.map((e) => e.getAttribute("data-icon")))).toEqual([
    "open_in_full",
    "wb_shade",
    "swap_horiz",
  ]);

  await page.getByRole("button", { name: "Tirar outra foto" }).click();
  await setProbs(page, 0.914, 0.086);
  await shoot(page);
  await analyze(page);
  await expect(page.getByRole("button", { name: "Nova avaliação" }).locator('[data-icon="photo_camera"]')).toBeVisible();

  await fakeClassifier(page, { load: "pending" });
  await page.goto("/analisar");
  await expect(page.getByTestId("shutter")).toBeEnabled();
  await shoot(page);
  await analyze(page);
  await expect(page.getByTestId("model-spinner")).toHaveCSS("animation-name", "spin");

  await fakeClassifier(page, { load: "fail" });
  await page.goto("/analisar");
  await expect(page.getByTestId("shutter")).toBeEnabled();
  await shoot(page);
  await analyze(page);
  const errorIcon = page.getByTestId("model-error").getByTestId("state-icon");
  await expect(errorIcon).toHaveCSS("background-color", rgb("#FAEBE8"));
  await expect(errorIcon.locator('[data-icon="report"]')).toBeVisible();

  await fromHomeGallery(page, { name: "quebrada.jpg", mimeType: "image/jpeg", buffer: Buffer.from("isto não é uma imagem") });
  await analyze(page);
  const imageIcon = page.getByTestId("image-error").getByTestId("state-icon");
  await expect(imageIcon).toHaveCSS("background-color", rgb("#FBF1DE"));
  await expect(imageIcon.locator('[data-icon="image_not_supported"]')).toBeVisible();
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
    await releaseClassify(page);
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
