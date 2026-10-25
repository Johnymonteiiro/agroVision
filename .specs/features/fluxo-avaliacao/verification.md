# Fluxo de avaliação a partir da Home verification

**Verdict**: FAIL
**Profile**: ui
**Diff range**: b49d14f..0e47007
**Round**: 1 - full
**Verifier**: independent sub-agent (author != verifier)

38 of 39 checks are proven by a located assertion at `0e47007`. The feature still fails on six counts:

- **Design contradiction.** AC 34 / C36 put the "Modelo"/"Data" rows and the disclaimer on every result. Design 1h does not draw them on the inconclusive result, and the plan does not record that deviation.
- **Missing elements.** Design elements are absent or unchecked: the review back button (1d), the model footer line on the analysing screen (1e), and the arrangement of the Home card, the review sheet and the result card.
- **Surviving mutant.** The INCONCLUSIVE bar fill can be changed and C33 still passes.
- **C6 not proven.** Its "abaixo do cartão" (position) is never asserted.
- **Two Test policy rows unmet.**
- **Unproven coverage members.** Several code branches and plan-named states have no proof.

## Binding sources

Source: Claude Design project "Gado Certo UI mockups", file `Gado Certo - Telas.dc.html` (project `96e99ff6-cd1e-4d21-b9d1-afca323c5bc7`), opened with `mcp__claude-design__read_file`, lines 200-463 (screens 1a-1h) and 660-723 (1q states, component sheet, scan/indeterminate renderers) of 723. Deviations the plan records (logo instead of the `eco` square, "AgroVision" title, no farm subtitle, no flash, no offline banner / pending badge / sync line, no "Salvar mesmo assim" / "Ver detalhes" / "Status" row / animal chip, model-unavailable screen not in design) are not counted below. The bottom tab bar composition predates this diff (`da1f2a7`). The diff only changes the Home `href` (C8).

| Source | Opened | Contradiction | Uncovered |
| --- | --- | --- | --- |
| design 1a Home online | yes - read_file, ~lines 228-256 | none | Card icon circle (76 px, `photo_camera`, `app/(tabs)/page.tsx:32-34`): no check. Button icons `photo_camera` / `photo_library`: no check. Order "Tirar foto" above "Escolher da galeria": no check. Arrangement "heading, subtitle and both buttons inside one white card": no check (C5 asserts only intro.y < heading.y). Model-status line "below the card": claimed by C6 but never asserted; C7 has no position at all. |
| design 1b Home offline | yes - read_file, ~lines 257-290 | none | With a model installed, 1b collapses the model line into one row ("IA disponível offline" … "Modelo v1.4" right-aligned). The code renders the 1a two-line form in both connection states (`app/(tabs)/model-status.tsx:31-45`). No check, no recorded deviation. |
| design 1c Captura | yes - read_file, ~lines 291-325 | none | The "Galeria" tile's `photo_library` icon and its visible caption: no check (C11/C14 reach the button only by `aria-label`). |
| design 1d Revisão | yes - read_file, ~lines 326-342 | none | Back button (`arrow_back`, 44 px white circle, top-left over the photo): drawn by 1d, NOT rendered (`components/guided-camera.tsx:440-471` has no back control), no check, not in Out of scope. Arrangement "photo ~2/3 on top, white sheet below": no check. Sheet order "question → Analisar imagem → Tirar outra foto → notes": no check. `replay` icon on "Tirar outra foto": no check. |
| design 1e Analisando | yes - read_file, ~lines 343-361 | none | Footer line `memory` + "<name> v<version> · no dispositivo" (rendered at `app/analisar/evaluation-flow.tsx:244-249`): no check. Vertical order "thumbnail → title → text → indeterminate bar": no check. |
| design 1f / 1g Resultado pronto / não pronto | yes - read_file, ~lines 365-412 | none | Card overlapping the photo, and the order inside it (decision block → confidence → bar → Modelo/Data rows → primary action → disclaimer): no check. `photo_camera` icon on "Nova avaliação": no check. 1g bar width 94%: not asserted (C32 asserts colour only). |
| design 1h Resultado inconclusivo | yes - read_file, ~lines 413-441 | 1h draws NO "Modelo"/"Data" rows and NO "Este resultado é uma estimativa gerada pelo modelo de IA." disclaimer. AC 34 ("em todo resultado"), and with it C36, require both on every result. The code renders them unconditionally (`app/analisar/result-view.tsx:94-119`). Neither Out of scope nor Assumptions records this deviation, and C36 proves it only on READY. | Confidence "62% de confiança": not asserted. Bar fill `#E8A93A`: not asserted (fault 5 survived). Threshold mark position at 85% (`result-view.tsx:69`): only visibility asserted. Tip icons `open_in_full` / `wb_shade` / `swap_horiz` and the `#FBF4E6` tips box: no check. |
| design 1q estados (carregando / erro / imagem inválida) | yes - read_file, ~lines 690-697 | none | Spinner on "Carregando modelo..." (`evaluation-flow.tsx:135`): no check. State icons `report` / `image_not_supported` in 64 px circles: no check. The code adds a "Fechar" (`close`) link to every state screen (`evaluation-flow.tsx:275`) that 1q does not draw: no check, no recorded deviation. |

## Checks

All 39 named tests exist, are new in this diff (4 files, 554 added lines) and ran individually at `0e47007` in two invocations:

- Unit: `pnpm vitest run tests/unit/decision.test.ts tests/unit/classifier.test.ts --reporter=verbose`, exit 0, 9 passed.
- E2E: `pnpm playwright test tests/e2e/home.spec.ts tests/e2e/avaliacao.spec.ts`, exit 0, 34 passed (2.4m). The run built `next` and served it on port 3100; nothing was listening there beforehand.

| Check | Claim | Proof run | Evidence | Result |
| --- | --- | --- | --- | --- |
| C1 | `/` is the Home, no redirect | E2E batch, "raiz abre a home" ✓ | `tests/e2e/home.spec.ts:12` - `expect(page.getByRole("heading", { name: "Analisar animal" })).toBeVisible()`; `:13` - `expect(page).toHaveURL(/^http:\/\/[^/]+\/$/)` | PASS |
| C2 | logo 36 px, "AgroVision" 18 px/700, chip to the right | E2E batch, "topo da home" ✓ | `tests/e2e/home.spec.ts:20` - `expect(Math.round((await logo.boundingBox())!.width)).toBe(36)`; `:22-23` - `toHaveCSS("font-size", "18px")`, `toHaveCSS("font-weight", "700")`; `:26` - `expect(chipBox.x).toBeGreaterThan(titleBox.x + titleBox.width)` | PASS |
| C3 | chip "Online" `#EAF5EF` / `#154C35` / dot `#18864B` | E2E batch, "chip online" ✓ | `tests/e2e/home.spec.ts:32-35` - `toHaveText("Online")`, `toHaveCSS("background-color", rgb("#EAF5EF"))`, `toHaveCSS("color", rgb("#154C35"))`, `online-dot` `rgb("#18864B")` | PASS |
| C4 | chip "Offline" `cloud_off` `#EEF0EF` / `#3C4641` | E2E batch, "chip offline" ✓ | `tests/e2e/home.spec.ts:42-45` - `toContainText("Offline")`, `locator('[data-icon="cloud_off"]')).toBeVisible()`, `rgb("#EEF0EF")`, `rgb("#3C4641")` | PASS |
| C5 | intro before card; card 26 px/700; buttons 60 px `#1F6B45` / 56 px `#EAF5EF` | E2E batch, "cartao analisar animal" ✓ | `tests/e2e/home.spec.ts:53` - `expect(intro.y).toBeLessThan(heading.y)`; `:54-55` 26px / 700; `:58-59` - `toBe(60)`, `rgb("#1F6B45")`; `:61-62` - `toBe(56)`, `rgb("#EAF5EF")` | PASS |
| C6 | no model: "Modelo de IA ainda não disponível" **below the card**, `offline_bolt` `#68736D`, no "IA disponível offline" | E2E batch, "sem modelo na home" ✓ | `tests/e2e/home.spec.ts:68` - `toHaveText(/Modelo de IA ainda não disponível/)`; `:69` - `toHaveCSS("color", rgb("#68736D"))`; `:70` - `toHaveCount(0)`. "abaixo do cartão" has NO assertion: searched `home.spec.ts` for any position read on `model-status`, and there is none (the test body is lines 65-71). | FAIL - position claim unproven |
| C7 | hook v1.4.0: "IA disponível offline" + "Modelo instalado: v1.4.0" | E2E batch, "modelo instalado na home" ✓ | `tests/e2e/home.spec.ts:77-78` - `toContainText("IA disponível offline")`, `toContainText("Modelo instalado: v1.4.0")` | PASS |
| C8 | Home tab `aria-current`, `href="/"`, tap from `/animais` opens `/`, `/inicio` 404 | E2E batch, "aba home" ✓ | `tests/e2e/home.spec.ts:84-85` - `toHaveAttribute("aria-current", "page")`, `toHaveAttribute("href", "/")`; `:88` - `toHaveURL(/^http:\/\/[^/]+\/$/)`; `:89` - `expect((await request.get("/inicio")).status()).toBe(404)` | PASS |
| C9 | "Tirar foto" opens camera with frame, prompt and four tips | E2E batch, "tirar foto abre a camera de avaliacao" ✓ | `tests/e2e/avaliacao.spec.ts:46` - `getByTestId("guide-frame")).toBeVisible()`; `:48` - `toHaveText(["Fotografe de lado", "Boa iluminação", "Só um animal", "Corpo inteiro"])` | PASS |
| C10 | centre bar button opens camera | E2E batch, "botao central abre a camera" ✓ | `tests/e2e/avaliacao.spec.ts:54-55` - `toHaveURL(/\/analisar/)`, `getByTestId("shutter")).toBeVisible()` | PASS |
| C11 | camera layout, no position/distance chips | E2E batch, "layout da camera de avaliacao" ✓ | `tests/e2e/avaliacao.spec.ts:63-67` - Cancelar `x < vw/2`, `y < vh/6`; chip `x > vw/2`; `:71` - `toBe(88)`; `:72-74` - `gallery.x < shutter.x`, `tips.x > shutter.x + shutter.width`, `y > 2vh/3`; `:75-76` - `camera-position` / `min-distance` `toHaveCount(0)` | PASS |
| C12 | no bar on camera, review, analysis, result | E2E batch, "fluxo sem barra inferior" ✓ | `tests/e2e/avaliacao.spec.ts:82`, `:84`, `:87`, `:90` - `expect(page.locator(nav)).toHaveCount(0)` | PASS |
| C13 | Home gallery `accept="image/*"` → `/analisar` review with chosen photo | E2E batch, "galeria da home vai para a revisao" ✓ | `tests/e2e/avaliacao.spec.ts:98` - `expect(await fc.element().getAttribute("accept")).toBe("image/*")`; `:100-102` - `toHaveURL(/\/analisar/)`, `review` visible, `review-photo` `toHaveAttribute("src", /^blob:/)` | PASS |
| C14 | camera "Galeria" `accept="image/*"` → review | E2E batch, "galeria da camera vai para a revisao" ✓ | `tests/e2e/avaliacao.spec.ts:110` - `toBe("image/*")`; `:112-113` - `review` visible, `src` `/^blob:/` | PASS |
| C15 | `NotAllowedError`: message, "Tentar novamente", Galeria still opens chooser | E2E batch, "permissao negada mantem a galeria" ✓ | `tests/e2e/avaliacao.spec.ts:121-122` - text and button `toBeVisible()`; `:124-126` - Galeria click → `filechooser` → `review` visible | PASS |
| C16 | review layout | E2E batch, "layout da revisao de avaliacao" ✓ | `tests/e2e/avaliacao.spec.ts:133` heading; `:135-137` - `toBe(60)`, `center_focus_strong` visible, `rgb("#1F6B45")`; `:139-141` - `toBe(56)`, `rgb("#EAF5EF")`, note visible | PASS |
| C17 | offline review line, "Analisar imagem" enabled | E2E batch, "revisao offline" ✓ | `tests/e2e/avaliacao.spec.ts:149-150` - text `toBeVisible()`, `toBeEnabled()` | PASS |
| C18 | "Tirar outra foto" back to camera | E2E batch, "tirar outra volta para a camera" ✓ | `tests/e2e/avaliacao.spec.ts:158-159` - `review` `toHaveCount(0)`, `shutter` `toBeEnabled()` | PASS |
| C19 | Cancelar → origin, direct → `/` | E2E batch, "cancelar volta para a origem" ✓ | `tests/e2e/avaliacao.spec.ts:165` and `:169` - `expect(page).toHaveURL(ROOT)` | PASS |
| C20 | no `/api/` request, camera and gallery, to result | E2E batch, "nenhuma chamada a api" ✓ | `tests/e2e/avaliacao.spec.ts:191` - `expect(api).toEqual([])` after results at `:187` and `:190` | PASS |
| C21 | analysing screen, no `%` | E2E batch, "tela analisando" ✓ | `tests/e2e/avaliacao.spec.ts:202-206` - heading, text, `analyzing-photo`, `scan-line`, `indeterminate-bar` visible; `:207` - `expect(screen).not.toContainText("%")` | PASS |
| C22 | "Carregando modelo..." then result on release | E2E batch, "carregando modelo" ✓ | `tests/e2e/avaliacao.spec.ts:216-217`; `:219` - `getByTestId("decision-block")).toContainText("PRONTO PARA ABATE")` | PASS |
| C23 | no model: copy, "Voltar ao início" → `/`, no decision / `%` | E2E batch, "sem modelo nao inventa resultado" ✓ | `tests/e2e/avaliacao.spec.ts:227-230`; `:232-234` - `not.toContainText("PRONTO")`, `("INCONCLUSIVO")`, `("%")`; `:236` - `toHaveURL(ROOT)` | PASS |
| C24 | load error copy; retry reaches result | E2E batch, "erro ao carregar o modelo" ✓ | `tests/e2e/avaliacao.spec.ts:244-245`; `:247-248` - "Tentar novamente" click → `decision-block` `toBeVisible()` | PASS |
| C25 | undecodable `quebrada.jpg` → error copy + "Tirar outra foto" | E2E batch, "imagem que nao decodifica" ✓ | `tests/e2e/avaliacao.spec.ts:253` fixture; `:255-257` - texts and button `toBeVisible()` | PASS |
| C26 | 0.85/0.15 @0.85 → READY | unit batch, "pronto no limiar" ✓ | `tests/unit/decision.test.ts:8` - `expect(decide({ ready: 0.85, notReady: 0.15 }, T85)).toBe("READY")` | PASS |
| C27 | 0.06/0.94 → NOT_READY | unit batch, "nao pronto acima do limiar" ✓ | `tests/unit/decision.test.ts:12` - `expect(decide({ ready: 0.06, notReady: 0.94 }, T85)).toBe("NOT_READY")` | PASS |
| C28 | 0.62/0.38 → INCONCLUSIVE | unit batch, "inconclusivo abaixo dos dois limiares" ✓ | `tests/unit/decision.test.ts:16` - `toBe("INCONCLUSIVE")` | PASS |
| C29 | 0.88 READY @0.85, INCONCLUSIVE @0.90 | unit batch, "limiar vem do modelo" ✓ | `tests/unit/decision.test.ts:21-22` - `toBe("READY")`, `toBe("INCONCLUSIVE")` | PASS |
| C30 | truncation 91 / 84 | unit batch, "confianca truncada" ✓ | `tests/unit/decision.test.ts:34-35` - `toBe(91)`, `toBe(84)` | PASS |
| C31 | READY block, icon, label, 91%, bar colour and width | E2E batch, "resultado pronto" ✓ | `tests/e2e/avaliacao.spec.ts:266-269` - `rgb("#18864B")`, `check_circle`, "PRONTO PARA ABATE", `toHaveText(/91%\s*de confiança/)`; `:271-272` - fill `rgb("#18864B")`, `toHaveAttribute("style", /width:\s*91%/)` | PASS |
| C32 | NOT_READY block, icon, label, 94%, bar colour | E2E batch, "resultado nao pronto" ✓ | `tests/e2e/avaliacao.spec.ts:281-285` - `rgb("#C74A3A")`, `cancel`, "NÃO PRONTO PARA ABATE", `toContainText("94%")`, fill `rgb("#C74A3A")` | PASS |
| C33 | INCONCLUSIVE block, text colour, icon, label, mark "mínimo 85%", message, three tips | E2E batch, "resultado inconclusivo" ✓ | `tests/e2e/avaliacao.spec.ts:294-299` - `rgb("#E8A93A")`, `rgb("#2E2206")`, `help`, label, `threshold-mark` visible, "mínimo 85%" visible; `:303-307` - tips `toHaveText([...])` | PASS - precision gap: mark position and bar fill unasserted (fault 5) |
| C34 | inconclusive primary "Tirar outra foto" → camera | E2E batch, "inconclusivo tira outra foto" ✓ | `tests/e2e/avaliacao.spec.ts:316-319` - `toHaveAttribute("data-primary-action")`, `rgb("#1F6B45")`, click → `shutter` `toBeEnabled()` | PASS |
| C35 | READY / NOT_READY primary "Nova avaliação" → camera | E2E batch, "nova avaliacao volta para a camera (pronto)" ✓ and "(nao pronto)" ✓ | `tests/e2e/avaliacao.spec.ts:332-335` - `data-primary-action`, `rgb("#1F6B45")`, click → `shutter` `toBeEnabled()` | PASS |
| C36 | photo on top, "Modelo" / "Data" rows, disclaimer, close → `/` | E2E batch, "dados do resultado" ✓ | `tests/e2e/avaliacao.spec.ts:347` - `expect((await photo.boundingBox())!.y).toBeLessThan(10)`; `:348-349` - `toHaveText(/Modelo\s*CattleClassifier v1\.4\.0/)`, `toHaveText(/Data\s*25 out 2026, 09:42/)`; `:350`; `:352-354` - `close` icon, `toHaveURL(ROOT)` | PASS (READY only; see Binding sources 1h) |
| C37 | no "autorizado" / "aprovado" on Home, camera, review, analysis, 3 results | E2E batch, "vocabulario proibido" ✓ | `tests/e2e/avaliacao.spec.ts:384` - `expect(t).not.toMatch(/autorizad\|aprovad/i)` over texts grabbed at `:362`, `:365`, `:373`, `:376`, `:379` | PASS |
| C38 | ≥ 44×44 and primary 56-60 px on Home, camera, review, result | E2E batch, "areas de toque do fluxo" ✓ | `tests/e2e/helpers.ts:188-193` - `expect.soft(t.w).toBeGreaterThanOrEqual(44)`, `(t.h)…(44)`, primary `>= 56` and `<= 60`; called at `tests/e2e/avaliacao.spec.ts:390`, `:393`, `:395`, `:398` | PASS |
| C39 | `loadClassifier()` rejects `ModelUnavailableError` without hook, resolves hook's | unit batch, "sem gancho rejeita…" ✓ and "com gancho resolve…" ✓ | `tests/unit/classifier.test.ts:16` - `await expect(loadClassifier()).rejects.toBeInstanceOf(ModelUnavailableError)`; `:21` - `resolves.toBe(fake)` | PASS |

- Swept, existing: the plan's Observable row "screen câmera / loading state: existing" holds. `components/guided-camera.tsx:297` renders "Carregando guia de enquadramento...". The other Swept rows cite checks or are `n/a` policy.
- `checks.md` Test policy evidence attributes the "regra de precedência" to C26-C29, but none of those cover it. It is proven only by an unlabelled test, `tests/unit/decision.test.ts:25-29`, which ran green ("as duas classes no limiar").

## Coverage

| Set (size) | Recomputed from | Member -> proof | Unproven |
| --- | --- | --- | --- |
| `Decision` values (3) | `lib/evaluation/decision.ts:4` | READY C26 · NOT_READY C27 · INCONCLUSIVE C28 | - |
| `decide` table rows (5) | `lib/evaluation/decision.ts:6-13` | READY only C26 · NOT_READY only C27 · neither C28 · both, READY wins / NOT_READY wins `decision.test.ts:27-28` (unlabelled, green) | - |
| threshold source (2) | `Classifier.model.threshold` (plan door 1) | 0.85 and 0.90 C29 | - |
| confidence truncation (2) | `lib/evaluation/decision.ts:19` | 0.914 → 91, 0.849 → 84 C30 (+ exact-value guard `decision.test.ts:39-40`) | - |
| decision look on screen (3 decisions × label / icon / block / fill = 12) | `app/analisar/result-view.tsx:8-12` (`LOOK`) | READY 4/4 C31 · NOT_READY 4/4 C32 · INCONCLUSIVE label, icon, block (+ text colour) C33 | INCONCLUSIVE fill `bg-warn` (`#E8A93A`, `result-view.tsx:11`): no assertion, fault 5 survived |
| analysis outcomes (code branches of `runAnalysis`, 8) | `app/analisar/evaluation-flow.tsx:40-77` | analysing C21 · decode fails C25 · model loading C22 · `ModelUnavailableError` C23 · other load error C24 · retry after error C24 · result C31 | `classify()` rejects → "Erro ao carregar o modelo" (`evaluation-flow.tsx:71-73`): no proof |
| model status on Home (4) | `app/(tabs)/model-status.tsx:15-27` + plan Observable rows "loading state" / "error state" | no model C6 · installed C7 | still loading (hook pending → no line, `model-status.tsx:27`) and load error other than `ModelUnavailableError` (→ "ainda não disponível", `:19`): both named in the plan's Observable, no proof |
| connection state on Home and review (4) | `components/connection-chip.tsx`, `evaluation-flow.tsx:211` | Home online C3 · Home offline C4 · review online C16 (`avaliacao.spec.ts:142`) · review offline C17 | - |
| entries into the flow (6) | `app/(tabs)/page.tsx`, `components/tab-bar.tsx:34`, `gallery-button.tsx`, `guided-camera.tsx` | "Tirar foto" C9 · centre button C10 · Home gallery C13 · camera gallery C14 · direct `/analisar` C19 / C22 · gallery on a denied camera C15 | - |
| flow transitions (13) | `evaluation-flow.tsx`, `result-view.tsx`, `guided-camera.tsx` | camera → review C16 · review → camera C18 · review → analysis C21 · inconclusive → camera C34 · result → camera C35 · result → `/` C36 · no model → `/` C23 · camera → origin C19 · gallery → review C13 / C14 · load error → retry C24 · loading → result C22 | image error "Tirar outra foto" → camera (`evaluation-flow.tsx:183`); "Fechar" → `/` on model-unavailable / model-error / image-error (`evaluation-flow.tsx:275`): no proof |
| `?de=` origin guard (accepted 3 / rejected 3) | `app/analisar/page.tsx:7` (regex `/^\/(?![/\\])/`) | `?de=/` C19 (`avaliacao.spec.ts:165`) · absent C19 (`:169`) · `?de=/animais` (`:174`) | rejected `//host`, `/\host`, non-string → `/`: no proof (this is the open-redirect guard the Handoff calls settled) |
| screens without the bar | only TabBar mount is `app/(tabs)/layout.tsx:9`; `/analisar` sits outside the group | camera, review, analysis, result C12; the other `/analisar` states share the route | - |
| forbidden-vocabulary screens (AC 35 "nenhuma tela do fluxo", 12) | `Step` union `evaluation-flow.tsx:21-29` + camera denied state | Home, camera, review, analysing, 3 results C37 | model loading, no model, load error, image error, camera denied: no proof |
| touch-target screens (AC 36 "todo controle tocável", 11) | same | Home, camera, review (camera path), READY result C38 | no model ("Voltar ao início", "Fechar"), load error ("Tentar novamente", "Fechar"), image error ("Tirar outra foto", "Fechar"), camera denied ("Tentar novamente"): no proof |
| Landing doors (3) | plan Landing | 1 classifier C39 · C7 · C23 · 2 vocabulary C26-C28 (literal strings) · 3 routes C1 · C8 · C12 | - |
| entities (0) | plan Relations: none | - | - |
| startup config (1 assembly) | `lib/evaluation/classifier.ts:32` is the only read of `window.__agroClassifier`; the only writes are `tests/e2e/helpers.ts:138` and `tests/unit/classifier.test.ts:20` | absent in the shipped app C23 · present only in tests C7 | - |

## Test policy rows

| Row | Files it classifies | Required proof | Expectation met |
| --- | --- | --- | --- |
| Decides, reached across a boundary | `lib/evaluation/decision.ts` (`decide`, `confidencePercent`), `lib/evaluation/classifier.ts` (`loadClassifier`), `app/(tabs)/model-status.tsx`, `app/analisar/evaluation-flow.tsx` (`runAnalysis`) | boundary + own layer, one case per decision-table row at own layer | no - `decide` / `confidencePercent` are met (5 rows at own layer + C31-C33). `loadClassifier`: the plan names three rows (gancho, sem modelo, erro), but only two are at its own layer (`classifier.test.ts:16,21`). The "erro" row has no own-layer case, and the cache reset that makes a retry possible (`classifier.ts:35-37`) is proven only through C24. The `classify()` failure branch and the Home loading/error branches have no proof. |
| Decides, not reached across a boundary | nothing in this diff | own layer | n/a - nothing classified |
| Entry point that decides nothing | `app/analisar/page.tsx`, `app/(tabs)/page.tsx`, `app/(tabs)/gallery-button.tsx` | boundary: accepted input, each rejected input, each error path | no - accepted inputs are proven (C1, C13, C19) and the bad image file is proven (C25). Rejected `?de=` values (`//host`, `/\host`) have no proof. |
| Instrumentation, pass-throughs | `lib/evaluation/result-date.ts`, `lib/evaluation/pending-photo.ts`, `components/connection-chip.tsx`, `components/tab-bar.tsx` (href change), `app/globals.css` tokens | covered by consumer | yes - C36 (`avaliacao.spec.ts:349`), C13, C3 / C4, C8 / C19 (`:172-174`), C31-C33 colours |

## Faults injected

Method:

- **Isolation.** All faults ran in a `git worktree add` at `0e47007` outside the repo, with `node_modules` as a junction to the real one.
- **Baseline.** The real tree's porcelain was recorded first.
- **Unit faults.** `vitest` was called directly, because `pnpm` tried to auto-install inside the worktree; that attempt failed and the real `node_modules/.modules.yaml` is unchanged (still Oct 4).
- **E2E faults.** For each one the worktree was rebuilt with `next build` and served by its own `next start -p 3100` (port checked free before each run), and Playwright reused that server.
- **Scaffolding.** Turbopack rejects a junction that points outside its root, so the worktree's `next.config.ts` alone got `turbopack.root` / `outputFileTracingRoot` set to `C:/Users/Johny`. This is test scaffolding, not a product change.
- **Fault 5 bundle check.** The served bundle was confirmed to carry `fill:"bg-ready"` for INCONCLUSIVE.

| Mutation | Location | Killed |
| --- | --- | --- |
| READY comparison `p.ready >= threshold.READY` → `>` | `lib/evaluation/decision.ts:7` | yes - C26 `tests/unit/decision.test.ts:8` ("expected 'INCONCLUSIVE' to be 'READY'") |
| truncation `Math.floor(… * 100 + 1e-9)` → `Math.round(… * 100)` | `lib/evaluation/decision.ts:19` | yes - C30 `tests/unit/decision.test.ts:35` ("expected 85 to be 84") |
| no-hook rejection `new ModelUnavailableError()` → `new Error("sem modelo")` | `lib/evaluation/classifier.ts:34` | yes - C39 `tests/unit/classifier.test.ts:16` ("expected Error: sem modelo to be an instance of ModelUnavailableError") |
| camera ignores `chips={false}` (guard forced true; position / distance chips render) | `components/guided-camera.tsx:244` | yes - C11 `tests/e2e/avaliacao.spec.ts:75` (`toHaveCount(0)`: expected 0, received 1) |
| INCONCLUSIVE bar fill `bg-warn` → `bg-ready` (green bar on an inconclusive result) | `app/analisar/result-view.tsx:11` | no - survived: "resultado inconclusivo" (C33) passed 1/1 against the mutant |

## Gate

- `pnpm vitest run tests/unit/decision.test.ts tests/unit/classifier.test.ts --reporter=verbose`: 9 passed, 0 failed.
- `pnpm playwright test tests/e2e/home.spec.ts tests/e2e/avaliacao.spec.ts`: 34 passed, 0 failed.
- Afterwards the worktree was removed (junction deleted first, `git worktree list` shows only the main tree), and the real tree's porcelain equals the baseline (`?? .agents/`, `?? .claude/`, `?? "PRD v1.1.md"`).

## Ranked gaps

1. **Design contradiction (1h).** AC 34 / C36 require the "Modelo"/"Data" rows and the disclaimer on every result, but 1h draws neither on the inconclusive result. The deviation is not recorded. Location: `app/analisar/result-view.tsx:94-119`.
2. **Missing design element (1d).** The review back button (`arrow_back`) is not rendered, has no check and is not excluded. Location: `components/guided-camera.tsx:440-471`.
3. **Unchecked design element (1e).** The analysing screen's footer model line ("<name> v<version> · no dispositivo") has no check. Location: `app/analisar/evaluation-flow.tsx:244-249`.
4. **Arrangement unchecked.** No check covers:
   - Home: card containment, button order, and the model line below the card.
   - Review: photo above the sheet and the order inside the sheet.
   - Result: card order and overlap with the photo.
   - Analysing: vertical order.
   - 1b: the compact model row.
5. **Surviving mutant (C33).** The INCONCLUSIVE bar fill is never asserted. Location: `app/analisar/result-view.tsx:11`.
6. **C6 FAIL.** "abaixo do cartão" is never asserted. Location: `tests/e2e/home.spec.ts:65-71`.
7. **Test policy row "Entry point" unmet.** The `?de=` open-redirect guard has no proof for rejected inputs. Location: `app/analisar/page.tsx:7`.
8. **Test policy row "Decides, across a boundary" unmet.** `loadClassifier` has no own-layer case for the error/retry row. Location: `lib/evaluation/classifier.ts:35-37`.
9. **Unproven coverage members.**
   - The `classify()` rejection branch (`evaluation-flow.tsx:71-73`).
   - The Home model loading/error states named in the plan's Observable (`model-status.tsx:19,27`).
   - The image-error "Tirar outra foto" and state-screen "Fechar" transitions (`evaluation-flow.tsx:183,275`).
   - AC 35 / AC 36 on the state screens and the camera-denied screen.
10. **Precision gaps.**
    - C33: the threshold-mark position (`result-view.tsx:69`).
    - C32: the bar width of 94%.
    - 1h: the confidence number (62%).
11. **Remaining uncovered design elements.**
    - Icons with no check: the Home card icon circle and button icons, the review `replay` icon, the result `photo_camera` icon, the inconclusive tip icons and tips box, the Galeria tile icon and caption.
    - 1q: the spinner and the state icons.
    - Code only: the "Fechar" link the code adds to the 1q state screens.
