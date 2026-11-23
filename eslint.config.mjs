import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Fronteiras entre módulos (.specs/features/estrutura-modular, door 2; modules/README.md).
// Cada módulo só importa os da lista; app/ importa qualquer um.
const MODULES = ["core", "vision", "model", "evaluation", "animals", "categories", "photos", "dataset"];
const ALLOWED = {
  core: [],
  vision: ["core"],
  model: ["core"],
  categories: ["core"],
  animals: ["core"],
  photos: ["core", "vision", "animals"],
  evaluation: ["core", "vision", "model"],
  dataset: ["core", "vision", "animals", "categories", "photos"],
};

const boundaries = MODULES.map((name) => {
  const forbidden = MODULES.filter((other) => other !== name && !ALLOWED[name].includes(other));
  return {
    files: [`modules/${name}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbidden.map((other) => ({
            // Alias (@/modules/x/...) e caminho relativo que sai do módulo (../x/..., ../../x/...).
            regex: `^(@/modules/${other}(/|$)|(\\.\\./)+(modules/)?${other}(/|$))`,
            message: `modules/${name} não pode importar modules/${other} (modules/README.md).`,
          })),
        },
      ],
    },
  };
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...boundaries,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Runtime WASM do MediaPipe copiado de node_modules.
    "public/mediapipe/**",
  ]),
]);

export default eslintConfig;
