import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const alias = {
  "@": fileURLToPath(new URL(".", import.meta.url)),
  // `import "server-only"` (modules/*/server, core/db, core/storage) só tem efeito no Next.
  "server-only": fileURLToPath(new URL("./tests/setup/server-only.ts", import.meta.url)),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts", "tests/infra/**/*.test.ts"],
          setupFiles: ["tests/setup/env.ts"],
          globalSetup: ["tests/setup/global.ts"],
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
