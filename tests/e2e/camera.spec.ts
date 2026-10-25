import { expect, test, type Page, type Request } from "@playwright/test";
import { createAnimal, resetDb, rgb } from "./helpers";

type Mode = "ready" | "loading" | "failed";

/** Substitui o detector real (lib/camera/detector.ts) por um controlado pelo teste. */
async function fakeDetector(page: Page, mode: Mode = "ready") {
  await page.addInitScript((m: Mode) => {
    const w = window as unknown as Record<string, unknown>;
    w.__gadoDetections = [];
    w.__gadoDetector = () =>
      m === "ready"
        ? Promise.resolve({ detect: () => w.__gadoDetections })
        : m === "failed"
          ? Promise.reject(new Error("falha simulada"))
          : new Promise(() => {});
  }, mode);
}

/** Caixa `cow` em frações do quadro real do vídeo. */
async function setBox(page: Page, box: [number, number, number, number] | null, score = 0.8) {
  await page.evaluate(
    ({ box, score }) => {
      const video = document.querySelector("video")!;
      const W = video.videoWidth;
      const H = video.videoHeight;
      (window as unknown as Record<string, unknown>).__gadoDetections = box
        ? [{ categoryName: "cow", score, box: { x: box[0] * W, y: box[1] * H, width: (box[2] - box[0]) * W, height: (box[3] - box[1]) * H } }]
        : [];
    },
    { box, score },
  );
}

const BOXES = {
  FRAMED: [0.1, 0.2, 0.9, 0.8],
  OUT_OF_FRAME: [0.02, 0.2, 0.9, 0.8],
  TOO_FAR: [0.3, 0.3, 0.7, 0.7],
} as const;

let animalId: string;

test.beforeEach(async ({ request }) => {
  await resetDb();
  animalId = (await createAnimal(request, { externalId: "023", weightKg: 450 })).id;
});

async function openCamera(page: Page, slug = "lateral") {
  await page.goto(`/animais/${animalId}/fotos/${slug}`);
  await expect(page.getByTestId("shutter")).toBeEnabled();
}

function framingOf(req: Request) {
  const body = req.postDataBuffer()?.toString("latin1") ?? "";
  return /name="framing"\r\n\r\n([A-Z_]+)/.exec(body)?.[1];
}

test("escolhe posicao antes da camera", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, number>;
    w.__gumCalls = 0;
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = (c) => {
      w.__gumCalls++;
      return original(c);
    };
  });
  await page.goto(`/animais/${animalId}`);
  await page.getByRole("link", { name: "Fotografar animal" }).click();
  await expect(page).toHaveURL(new RegExp(`/animais/${animalId}/fotos$`));
  for (const name of ["De trás", "De cima", "Lateral"]) {
    await expect(page.getByRole("link", { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  expect(await page.evaluate(() => (window as unknown as Record<string, number>).__gumCalls)).toBe(0);
});

test("layout da camera", async ({ page }) => {
  await fakeDetector(page);
  await openCamera(page);
  const vh = 844;
  const cancel = await page.getByRole("link", { name: "Cancelar" }).boundingBox();
  const chip = await page.getByTestId("connection-chip").boundingBox();
  expect(cancel!.x).toBeLessThan(195);
  expect(cancel!.y).toBeLessThan(100);
  expect(chip!.x).toBeGreaterThan(195);
  expect(chip!.y).toBeLessThan(100);
  await expect(page.getByText("Posicione o animal inteiro dentro da área")).toBeVisible();
  await expect(page.getByTestId("guide-corner")).toHaveCount(4);
  await expect(page.getByTestId("tips").locator("li")).toHaveCount(4);
  for (const el of [page.getByTestId("photo-counter"), page.getByTestId("shutter"), page.getByRole("button", { name: "Dicas" })]) {
    const box = await el.boundingBox();
    expect(box!.y).toBeGreaterThan((vh * 2) / 3);
  }
  const shutter = await page.getByTestId("shutter").boundingBox();
  expect([Math.round(shutter!.width), Math.round(shutter!.height)]).toEqual([88, 88]);
});

test("dicas por posicao", async ({ page }) => {
  await fakeDetector(page);
  for (const [slug, first] of [
    ["de-tras", "Fotografe por trás"],
    ["de-cima", "Fotografe de cima"],
    ["lateral", "Fotografe de lado"],
  ]) {
    await page.goto(`/animais/${animalId}/fotos/${slug}`);
    await expect(page.getByTestId("tips").getByTestId("tip-text")).toHaveText([first, "Boa iluminação", "Só um animal", "Corpo inteiro"]);
  }
});

test("mostra distancia minima da lateral 450 kg", async ({ page }) => {
  await fakeDetector(page);
  await openCamera(page);
  const dims = await page.evaluate(() => [document.querySelector("video")!.videoWidth, document.querySelector("video")!.videoHeight]);
  expect(dims[0] / dims[1]).toBeCloseTo(4 / 3, 2);
  await expect(page.getByTestId("min-distance")).toHaveText("Distância mínima: 2,1 m");
  await expect(page.getByTestId("camera-position")).toHaveText("Lateral");
});

for (const [name, state, box, label, color] of [
  ["estado enquadrado", "FRAMED", BOXES.FRAMED, "Enquadrado", "#7FD1A3"],
  ["estado afaste-se", "OUT_OF_FRAME", BOXES.OUT_OF_FRAME, "Afaste-se — o animal não cabe no quadro", "#E8A93A"],
  ["estado aproxime-se", "TOO_FAR", BOXES.TOO_FAR, "Aproxime-se", "#E8A93A"],
  ["estado nao detectado", "NOT_DETECTED", null, "Animal não detectado", "#FFFFFF"],
] as const) {
  test(name, async ({ page }) => {
    await fakeDetector(page);
    await openCamera(page);
    await setBox(page, box ? [...box] : null);
    const status = page.getByTestId("framing-status");
    await expect(status).toHaveAttribute("data-framing", state);
    await expect(status).toHaveText(label);
    for (const corner of await page.getByTestId("guide-corner").all()) {
      await expect(corner).toHaveCSS("border-top-color", rgb(color));
    }
  });
}

test("estado nao detectado com score 0,49", async ({ page }) => {
  await fakeDetector(page);
  await openCamera(page);
  await setBox(page, [...BOXES.FRAMED], 0.49);
  await expect(page.getByTestId("framing-status")).toHaveAttribute("data-framing", "NOT_DETECTED");
});

test("detector carregando mostra aviso e distancia", async ({ page }) => {
  await fakeDetector(page, "loading");
  await openCamera(page);
  await expect(page.getByTestId("framing-status")).toHaveText("Carregando guia de enquadramento...");
  await expect(page.getByTestId("min-distance")).toHaveText("Distância mínima: 2,1 m");
});

test("detector indisponivel mantem o disparo", async ({ page }) => {
  await fakeDetector(page, "failed");
  await openCamera(page);
  const status = page.getByTestId("framing-status");
  await expect(status).toHaveText("Guia de enquadramento indisponível");
  await expect(status).toHaveAttribute("data-framing", "UNAVAILABLE");
  await expect(page.getByTestId("shutter")).toBeEnabled();
});

test("disparo em todos os estados envia o estado do instante", async ({ page }) => {
  const sent: string[] = [];
  await page.route(`**/api/animals/${animalId}/images`, async (route) => {
    sent.push(framingOf(route.request()) ?? "?");
    await route.fulfill({ status: 201, json: { image: {} } });
  });

  await fakeDetector(page);
  await openCamera(page);
  for (const [state, box] of [
    ["FRAMED", BOXES.FRAMED],
    ["OUT_OF_FRAME", BOXES.OUT_OF_FRAME],
    ["TOO_FAR", BOXES.TOO_FAR],
    ["NOT_DETECTED", null],
  ] as const) {
    await setBox(page, box ? [...box] : null);
    await expect(page.getByTestId("framing-status")).toHaveAttribute("data-framing", state);
    await expect(page.getByTestId("shutter")).toBeEnabled();
    await page.getByTestId("shutter").click();
    await page.getByRole("button", { name: "Usar foto" }).click();
    await expect(page.getByTestId("review")).toHaveCount(0);
  }

  const failing = await page.context().newPage();
  await failing.route(`**/api/animals/${animalId}/images`, async (route) => {
    sent.push(framingOf(route.request()) ?? "?");
    await route.fulfill({ status: 201, json: { image: {} } });
  });
  await fakeDetector(failing, "failed");
  await openCamera(failing);
  await expect(failing.getByTestId("framing-status")).toHaveAttribute("data-framing", "UNAVAILABLE");
  await failing.getByTestId("shutter").click();
  await failing.getByRole("button", { name: "Usar foto" }).click();
  await expect(failing.getByTestId("review")).toHaveCount(0);

  expect(sent).toEqual(["FRAMED", "OUT_OF_FRAME", "TOO_FAR", "NOT_DETECTED", "UNAVAILABLE"]);
});

test("layout da revisao", async ({ page }) => {
  await fakeDetector(page);
  await openCamera(page);
  await setBox(page, [...BOXES.FRAMED]);
  await expect(page.getByTestId("framing-status")).toHaveAttribute("data-framing", "FRAMED");
  await page.getByTestId("shutter").click();
  const photo = await page.getByTestId("review-photo").boundingBox();
  const ratio = photo!.height / 844;
  expect(ratio).toBeGreaterThanOrEqual(0.6);
  expect(ratio).toBeLessThanOrEqual(0.72);
  await expect(page.getByText("Esta foto está boa para o dataset?")).toBeVisible();
  await expect(page.getByTestId("review-info")).toContainText("Lateral");
  await expect(page.getByTestId("review-info")).toContainText("Enquadrado");
  await expect(page.getByRole("button", { name: "Usar foto" })).toHaveCSS("background-color", rgb("#1F6B45"));
  await expect(page.getByRole("button", { name: "Tirar outra foto" })).toHaveCSS("background-color", rgb("#EAF5EF"));
});

test("tirar outra descarta sem enviar", async ({ page }) => {
  const uploads: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/images") && r.method() === "POST") uploads.push(r.url());
  });
  await fakeDetector(page);
  await openCamera(page);
  await page.getByTestId("shutter").click();
  await page.getByRole("button", { name: "Tirar outra foto" }).click();
  await expect(page.getByTestId("review")).toHaveCount(0);
  await expect(page.getByTestId("shutter")).toBeVisible();
  expect(uploads).toEqual([]);
});

test("usar foto envia e conta", async ({ page }) => {
  const positions: string[] = [];
  await page.route(`**/api/animals/${animalId}/images`, async (route) => {
    const body = route.request().postDataBuffer()?.toString("latin1") ?? "";
    positions.push(/name="position"\r\n\r\n([A-Z]+)/.exec(body)?.[1] ?? "?");
    await route.continue();
  });
  await fakeDetector(page);
  await openCamera(page);
  for (let i = 1; i <= 2; i++) {
    await page.getByTestId("shutter").click();
    const response = page.waitForResponse((r) => r.url().endsWith(`/api/animals/${animalId}/images`));
    await page.getByRole("button", { name: "Usar foto" }).click();
    expect((await response).status()).toBe(201);
    await expect(page.getByTestId("review")).toHaveCount(0);
  }
  expect(positions).toEqual(["SIDE", "SIDE"]);
  await expect(page.getByTestId("camera-position")).toHaveText("Lateral");
  await expect(page.getByTestId("photo-counter-label")).toHaveText("2 fotos");
});

test("cancelar volta ao perfil", async ({ page }) => {
  await fakeDetector(page);
  await openCamera(page);
  await page.getByRole("link", { name: "Cancelar" }).click();
  await expect(page).toHaveURL(new RegExp(`/animais/${animalId}$`));
});

test("permissao negada", async ({ page }) => {
  await fakeDetector(page);
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("negado", "NotAllowedError"));
  });
  await page.goto(`/animais/${animalId}/fotos/lateral`);
  await expect(page.getByText("Permita o acesso à câmera nas configurações do navegador")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tentar novamente" })).toBeVisible();
});

test("offline desabilita usar foto", async ({ page, context }) => {
  await fakeDetector(page);
  await openCamera(page);
  await page.getByTestId("shutter").click();
  await context.setOffline(true);
  await expect(page.getByRole("button", { name: "Usar foto" })).toBeDisabled();
  await expect(page.getByText("Sem internet — conecte-se para enviar.")).toBeVisible();
  await context.setOffline(false);
});
