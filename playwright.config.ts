import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { TEST_ENV } from "./tests/setup/env";

const PORT = 3100;
// Quadro da câmera falsa: a foto de referência do bovino, gerada pelo global-setup. Com o padrão
// sintético do Chromium, a checagem de qualidade (qualidade-imagem) mediria uma imagem que não é foto.
const COW_Y4M = path.join(process.cwd(), "test-results", "fixtures", "cow-side.y4m");

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 390, height: 844 },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    permissions: ["camera"],
    launchOptions: {
      args: [
        "--use-fake-device-for-media-stream",
        "--use-fake-ui-for-media-stream",
        `--use-file-for-fake-video-capture=${COW_Y4M}`,
      ],
    },
  },
  webServer: {
    command: `pnpm build && pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}/animais`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: TEST_ENV,
  },
});
