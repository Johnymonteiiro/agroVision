# Estrutura modular - checks

Profile: ui
Plan: `.specs/features/estrutura-modular/plan.md`

## Intent

14 checks in 2 slices · 3 one-way doors · 0 open. Base: `d647485` (fim da F1b); a mudança só
move arquivos e reescreve imports.

## Checks

As provas estruturais estão em `tests/unit/module-boundaries.test.ts` (Vitest, projeto `unit`,
sem serviços). Esse teste lê a árvore de arquivos e usa a API do ESLint (`new ESLint().lintText`
com `filePath` dentro de cada módulo) para provar as fronteiras. As suítes de comportamento são
as mesmas das features anteriores; elas precisam do `db` e do `minio` do `docker compose`. **Os
testes rodam só com autorização do usuário.**

### S1 - Nada muda para quem usa o app · ~70 files · ~300 KB · ~75k

**C1** - A suíte inteira passa com os mesmos números de `d647485`: Vitest unit 74 mais os testes novos de `module-boundaries.test.ts`, Vitest integration 38, Playwright 156 (AC 1)
Proof: `pnpm vitest run --project unit --project integration`
Proof: `pnpm playwright test`

**C2** - Em `git diff d647485 -- tests`, fora dos dois arquivos novos (`tests/unit/module-boundaries.test.ts` e `tests/setup/server-only.ts`), toda linha adicionada ou removida é uma linha de import (AC 2)
Proof: `git diff d647485 -- tests ":(exclude)tests/unit/module-boundaries.test.ts" ":(exclude)tests/setup/server-only.ts" | grep -E "^[+-][^+-]" | grep -vE "^[+-]\s*(import |\} from |export \{ .* \} from )|import\(\"" | (! grep .)` (regex corrigido no build: a versão aprovada não reconhecia `await import("…")` como linha de import; o claim não mudou)
Done: yes

**C3** - `pnpm drizzle-kit generate` imprime "No schema changes", e `git status --porcelain drizzle` continua vazio (AC 3)
Proof: `pnpm drizzle-kit generate 2>&1 | grep -q "No schema changes" && test -z "$(git status --porcelain drizzle)"`
Done: yes

**C4** - `pnpm build` termina com exit 0. Um componente client que importasse um arquivo com `server-only` faria o build falhar (AC 4, door 3)
Proof: `pnpm build`

### S2 - Módulos com fronteiras fiscalizadas · 4 files · 12 KB · ~3k

**C5** - `modules/` tem exatamente as pastas `animals`, `categories`, `core`, `dataset`, `evaluation`, `model`, `photos` e `vision`, e não existem `lib/` nem `components/` na raiz (AC 5, door 1)
Proof: `pnpm vitest run tests/unit/module-boundaries.test.ts -t "pastas dos modulos"`

**C6** - Todo arquivo em `app/` tem um destes nomes: `page.tsx`, `layout.tsx`, `loading.tsx`, `route.ts`, `globals.css`, `icon.png` ou `apple-icon.png` (AC 6)
Proof: `pnpm vitest run tests/unit/module-boundaries.test.ts -t "app so com arquivos de rota"`

**C7** - Existem em `modules/vision`:
- `detection/detector.ts`, que contém `__gadoDetector`;
- `detection/framing.ts`, que exporta `classifyFraming`;
- `geometry/guide-rect.ts`;
- `geometry/min-distance.ts`, que exporta `minDistance`;
- `positions.ts`, que exporta `POSITION_LABEL`;
- `camera/guided-camera.tsx`, que exporta `GuidedCamera` e `PhotoReview`.

(AC 7)
Proof: `pnpm vitest run tests/unit/module-boundaries.test.ts -t "visao computacional reunida"`

**C8** - Existem em `modules/model`:
- `classifier.ts`, que exporta `loadClassifier` e `ModelUnavailableError` e contém `__agroClassifier`;
- `decision.ts`, que exporta `decide`;
- `components/model-status.tsx`.

(AC 8)
Proof: `pnpm vitest run tests/unit/module-boundaries.test.ts -t "modelo reunido"`

**C9** - O ESLint acusa `no-restricted-imports` em cada import proibido pela door 2, um por módulo de origem:
- `core` → `vision`;
- `vision` → `animals`;
- `model` → `vision`;
- `categories` → `animals`;
- `animals` → `categories`;
- `photos` → `dataset`;
- `evaluation` → `animals`;
- `dataset` → `evaluation`.

Vale para a forma com alias (`@/modules/animals/format`) e para a forma relativa (`../../animals/format`) (AC 9, door 2)
Proof: `pnpm vitest run tests/unit/module-boundaries.test.ts -t "import proibido falha no lint"`

**C10** - O ESLint não acusa `no-restricted-imports` em imports permitidos:
- `vision` → `core`;
- `photos` → `animals`;
- `photos` → `vision`;
- `evaluation` → `model`;
- `dataset` → `photos`;
- `app/` → `dataset`.

(AC 10, door 2)
Proof: `pnpm vitest run tests/unit/module-boundaries.test.ts -t "import permitido passa no lint"`

**C11** - A primeira linha é `import "server-only";` em todo arquivo de `modules/*/server/` (pelo menos `animals`, `categories`, `dataset` e `photos`), em `modules/core/db/client.ts`, em `modules/core/db/migrate.ts` e em `modules/core/storage/object-store.ts`. Em `modules/core/db/schema.ts`, não (AC 11, door 3)
Proof: `pnpm vitest run tests/unit/module-boundaries.test.ts -t "marcador server-only"`

**C12** - `modules/README.md` cita os 8 módulos e, para cada um, a lista de dependências da door 2 (AC 12)
Proof: `pnpm vitest run tests/unit/module-boundaries.test.ts -t "readme dos modulos"`

**C13** - Nenhum arquivo `.ts`/`.tsx` em `app/`, `modules/`, `tests/` nem `instrumentation.ts` contém `@/lib/` ou `@/components/` (AC 13)
Proof: `pnpm vitest run tests/unit/module-boundaries.test.ts -t "sem imports antigos"`

**C14** - `pnpm lint` na árvore real termina com exit 0 e nenhum aviso ou erro de `no-restricted-imports`: nenhum arquivo movido viola a door 2 (AC 9, AC 10)
Proof: `pnpm lint`
Done: yes

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| suites (4) | Vitest unit C1 · Vitest integration C1 · Playwright C1 · `next build` C4 | - |
| modules (8) | `animals` C5 · `categories` C5 · `core` C5 · `dataset` C5 · `evaluation` C5 · `model` C5 · `photos` C5 · `vision` C5 | - |
| allowed names in `app/` (7) | `page.tsx` C6 · `layout.tsx` C6 · `loading.tsx` C6 · `route.ts` C6 · `globals.css` C6 · `icon.png` C6 · `apple-icon.png` C6 | - |
| vision members (6) | detector C7 · enquadramento C7 · guia C7 · distância mínima C7 · posições C7 · câmera guiada C7 | - |
| model members (3) | porta do classificador C8 · decisão C8 · status do modelo C8 | - |
| forbidden edges, one per source module (8) | `core` C9 · `vision` C9 · `model` C9 · `categories` C9 · `animals` C9 · `photos` C9 · `evaluation` C9 · `dataset` C9 | - |
| import forms (2) | alias `@/modules/...` C9 · relativo `../../<módulo>/...` C9 | - |
| allowed edges (6) | `vision`→`core` C10 · `photos`→`animals` C10 · `photos`→`vision` C10 · `evaluation`→`model` C10 · `dataset`→`photos` C10 · `app/`→`dataset` C10 | - |
| server-only places (4 groups) | `modules/*/server/*` C11 · `core/db/client.ts` C11 · `core/db/migrate.ts` C11 · `core/storage/object-store.ts` C11 · `schema.ts` sem marcador C11 | - |
| Landing doors (3) | 1 C5 · C6 · C7 · C8 · 2 C9 · C10 · C12 · C14 · 3 C4 · C11 | - |
| entities (0) | none - schema unchanged (C3) | - |
| startup config: `server-only` resolution (2 assemblies) | Next (build e start) C4 · C1 Playwright · Vitest via alias C1 | - |

- No route is added or changed (`Surface: None`), so there is no status set
- C9 and C10 prove the rule at its own layer (ESLint over a virtual file); C14 proves the real tree obeys it (`pnpm lint` over every module)

## Test policy

No decision code is added or changed: every moved file keeps its existing proofs at the same
level (the rows of `cadastro-animal`, `fluxo-avaliacao` and `dataset-rotulos` carry over
unchanged). The only new code is configuration (`eslint.config.mjs`, `vitest.config.mts`) and
its structural test (C5-C13).

| Code | Required proofs | Coverage expectation |
| --- | --- | --- |
| Decides, reached across a boundary | one at the boundary **and** one at its own layer | carried from the previous features, unchanged |
| Decides, not reached across a boundary | one at its own layer | carried, unchanged |
| Entry point that decides nothing | one at the boundary | carried, unchanged |
| Instrumentation, pass-throughs | none of its own | covered by its consumer's proof |

Evidence:
- `eslint.config.mjs` (boundary block): a mapping of 8 source modules to their forbidden targets -> decides, reached by `pnpm lint` -> C9, C10 at its own layer (ESLint API)
- every moved file: same body, new path -> its previous proofs (C1)

## Swept

- validation: n/a - nenhuma entrada nova; as validações existentes só mudam de pasta (C1)
- failure modes: C4
- idempotency: n/a - nada é gravado por esta mudança
- authorization: n/a - o MVP não tem contas
- concurrency: n/a - nenhuma lógica de execução muda
- data lifecycle: C3
- dependency failure: n/a - nenhuma dependência externa nova; `server-only` resolvido pelo Next e por alias no Vitest (C1, C4)
- state transitions: n/a - nenhum estado novo
- observability: n/a - nenhum log ou métrica muda

## Handoff

Tamanho: `lib/` + `components/` + os componentes de `app/` + os imports de `tests/` somam cerca de
300 KB, e a maior parte é movida com `git mv` e reescrita de imports, sem leitura integral. Mais
12 KB de arquivos novos (README, teste de fronteiras, stub, bloco do ESLint). Total ≈ 312 KB ÷ 4
≈ 78k.

- S1-S2 = 78k, under the 150k budget - one builder

- **Boundary:** código em `febfdf9` (feature base `d647485`, specs em `6a5143c`). Rodados no build: C2 (diff dos testes só com imports), C3 ("No schema changes, nothing to migrate"), C14 (`pnpm lint` exit 0), além de `pnpm typecheck` limpo e de um smoke manual no `pnpm dev` (`/`, `/dataset`, `/animais`, `/dataset/novo`, `/dataset/categorias/nova`, `/analisar`, `/historico`, `/ajustes` e `/app.webmanifest` com 200; `POST /api/categories` inválido com 422). **Não rodados**: C1, C4 e C5-C13 (Vitest, Playwright e `next build`). O usuário não autorizou rodar testes nesta feature, e por isso o Verifier também não foi despachado
- **Settled mid-build:**
  - a mudança saiu num script só (`git mv` mais reescrita de imports), e não em um commit por módulo: os imports se cruzam, então commits intermediários não compilariam. Ficaram três commits de código (mudança, lint, teste);
  - o regex da prova de C2 passou a aceitar `await import("…")` como linha de import; o claim não mudou;
  - sondagem do ESLint via stdin (não é teste): `modules/vision` importando `@/modules/animals/...` e `../../animals/...` acusa `no-restricted-imports`, e `modules/photos` → `animals` não acusa
- **Abandoned:**
  - deixar o script juntar imports multilinha que não mudavam: o `api-images.test.ts` voltou ao formato original, para o diff dos testes mostrar só caminhos;
  - em `evaluation-flow.tsx`, a linha que passou de 110 caracteres voltou a ser multilinha
