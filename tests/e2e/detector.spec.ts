import { expect, test } from "@playwright/test";
import { COW_Y4M } from "./global-setup";
import { createAnimal, resetDb } from "./helpers";

// A câmera falsa do Chromium exibe a foto de referência (tests/fixtures/cow-side.jpg).
test.use({
  launchOptions: {
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
      `--use-file-for-fake-video-capture=${COW_Y4M}`,
    ],
  },
});

let animalId: string;

test.beforeEach(async ({ request }) => {
  await resetDb();
  animalId = (await createAnimal(request, { weightKg: 450 })).id;
});

test("detector servido localmente", async ({ page }) => {
  const urls: string[] = [];
  page.on("request", (r) => urls.push(r.url()));
  await page.goto(`/animais/${animalId}/fotos/lateral`);
  await expect(page.getByTestId("framing-status")).not.toHaveAttribute("data-framing", "LOADING", { timeout: 60_000 });
  await expect(page.getByTestId("framing-status")).not.toHaveAttribute("data-framing", "UNAVAILABLE");

  expect(urls.some((u) => /\/mediapipe\/wasm\/vision_wasm[a-z_]*\.wasm$/.test(new URL(u).pathname))).toBe(true);
  expect(urls.some((u) => new URL(u).pathname === "/mediapipe/efficientdet_lite0_uint8.tflite")).toBe(true);
  expect(urls.filter((u) => /cdn\.jsdelivr\.net|storage\.googleapis\.com/.test(u))).toEqual([]);
});

test("detecta vaca na foto de referencia", async ({ page }) => {
  await page.goto(`/animais/${animalId}/fotos/lateral`);
  await expect(page.getByTestId("framing-status")).toHaveAttribute("data-framing", /^(FRAMED|OUT_OF_FRAME|TOO_FAR)$/, {
    timeout: 60_000,
  });
});
