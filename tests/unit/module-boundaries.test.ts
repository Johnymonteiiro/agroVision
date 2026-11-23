import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

// estrutura-modular C5-C13: a árvore de modules/, app/ só com rotas e as fronteiras da door 2.
const ROOT = process.cwd();
const MODULES = ["animals", "categories", "core", "dataset", "evaluation", "model", "photos", "vision"];

function walk(dir: string): string[] {
  return readdirSync(path.join(ROOT, dir)).flatMap((name) => {
    const rel = path.posix.join(dir, name);
    return statSync(path.join(ROOT, rel)).isDirectory() ? walk(rel) : [rel];
  });
}

const read = (file: string) => readFileSync(path.join(ROOT, file), "utf8");

let eslint: ESLint | undefined;
async function restricted(filePath: string, specifier: string) {
  eslint ??= new ESLint({ cwd: ROOT });
  const code = `import * as probe from "${specifier}";\nexport const used = probe;\n`;
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((m) => m.ruleId === "no-restricted-imports");
}

describe("estrutura modular", () => {
  it("pastas dos modulos", () => {
    const dirs = readdirSync(path.join(ROOT, "modules"), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
    expect(dirs).toEqual(MODULES);
    expect(existsSync(path.join(ROOT, "lib"))).toBe(false);
    expect(existsSync(path.join(ROOT, "components"))).toBe(false);
  });

  it("app so com arquivos de rota", () => {
    const allowed = new Set(["page.tsx", "layout.tsx", "loading.tsx", "route.ts", "globals.css", "icon.png", "apple-icon.png"]);
    const outside = walk("app").filter((f) => !allowed.has(path.posix.basename(f)));
    expect(outside).toEqual([]);
  });

  it("visao computacional reunida", () => {
    expect(read("modules/vision/detection/detector.ts")).toContain("__gadoDetector");
    expect(read("modules/vision/detection/framing.ts")).toMatch(/export function classifyFraming/);
    expect(existsSync(path.join(ROOT, "modules/vision/geometry/guide-rect.ts"))).toBe(true);
    expect(read("modules/vision/geometry/min-distance.ts")).toMatch(/export function minDistance/);
    expect(read("modules/vision/positions.ts")).toMatch(/export const POSITION_LABEL/);
    const camera = read("modules/vision/camera/guided-camera.tsx");
    expect(camera).toMatch(/export function GuidedCamera/);
    expect(camera).toMatch(/export function PhotoReview/);
  });

  it("modelo reunido", () => {
    const classifier = read("modules/model/classifier.ts");
    expect(classifier).toMatch(/export (async )?function loadClassifier/);
    expect(classifier).toMatch(/export class ModelUnavailableError/);
    expect(classifier).toContain("__agroClassifier");
    expect(read("modules/model/decision.ts")).toMatch(/export function decide/);
    expect(existsSync(path.join(ROOT, "modules/model/components/model-status.tsx"))).toBe(true);
  });

  // Um import proibido por módulo de origem, nas formas com alias e relativa.
  const FORBIDDEN: Array<[string, string]> = [
    ["core", "vision"],
    ["vision", "animals"],
    ["model", "vision"],
    ["categories", "animals"],
    ["animals", "categories"],
    ["photos", "dataset"],
    ["evaluation", "animals"],
    ["dataset", "evaluation"],
  ];

  it("import proibido falha no lint", { timeout: 60_000 }, async () => {
    for (const [from, to] of FORBIDDEN) {
      const file = `modules/${from}/probe.ts`;
      expect(await restricted(file, `@/modules/${to}/x`), `${from} -> @/modules/${to}`).toHaveLength(1);
      expect(await restricted(file, `../${to}/x`), `${from} -> ../${to}`).toHaveLength(1);
    }
  });

  it("import permitido passa no lint", { timeout: 60_000 }, async () => {
    const allowed: Array<[string, string]> = [
      ["modules/vision/probe.ts", "@/modules/core/ui/icon"],
      ["modules/photos/probe.ts", "@/modules/animals/format"],
      ["modules/photos/probe.ts", "@/modules/vision/positions"],
      ["modules/evaluation/probe.ts", "@/modules/model/decision"],
      ["modules/dataset/probe.ts", "@/modules/photos/send-photo"],
      ["app/probe/page.tsx", "@/modules/dataset/summary"],
    ];
    for (const [file, specifier] of allowed) {
      expect(await restricted(file, specifier), `${file} -> ${specifier}`).toEqual([]);
    }
  });

  it("marcador server-only", () => {
    const serverFiles = MODULES.flatMap((m) =>
      existsSync(path.join(ROOT, "modules", m, "server")) ? walk(`modules/${m}/server`) : [],
    );
    expect(serverFiles.map((f) => f.split("/")[1])).toEqual(
      expect.arrayContaining(["animals", "categories", "dataset", "photos"]),
    );
    const marked = [
      ...serverFiles,
      "modules/core/db/client.ts",
      "modules/core/db/migrate.ts",
      "modules/core/storage/object-store.ts",
    ];
    for (const file of marked) expect(read(file).split(/\r?\n/)[0], file).toBe('import "server-only";');
    expect(read("modules/core/db/schema.ts").split(/\r?\n/)[0]).not.toBe('import "server-only";');
  });

  it("readme dos modulos", () => {
    const deps: Record<string, string[]> = {
      core: [],
      vision: ["core"],
      model: ["core"],
      categories: ["core"],
      animals: ["core"],
      photos: ["core", "vision", "animals"],
      evaluation: ["core", "vision", "model"],
      dataset: ["core", "vision", "animals", "categories", "photos"],
    };
    const rows = read("modules/README.md").split(/\r?\n/);
    for (const [name, list] of Object.entries(deps)) {
      const row = rows.find((r) => r.startsWith(`| \`${name}\` |`));
      expect(row, name).toBeDefined();
      const last = row!.split("|").at(-2)!;
      if (list.length === 0) expect(last).toContain("nenhum módulo");
      else expect(last.match(/`(\w+)`/g)?.map((s) => s.slice(1, -1))).toEqual(list);
    }
  });

  it("sem imports antigos", () => {
    const old = ["@/" + "lib/", "@/" + "components/"];
    const files = [...walk("app"), ...walk("modules"), ...walk("tests"), "instrumentation.ts"].filter((f) =>
      /\.(ts|tsx|mts)$/.test(f),
    );
    const offenders = files.filter((f) => old.some((o) => read(f).includes(o)));
    expect(offenders).toEqual([]);
  });
});
