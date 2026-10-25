# Fluxo de avaliação a partir da Home verification

**Verdict**: FAIL
**Profile**: ui
**Diff range**: b49d14f..e4d8194
**Round**: 2 - scoped
**Verifier**: independent sub-agent (author != verifier)

55 of 58 checks are proven by a located assertion at `e4d8194`. The fix closes most of round 1: the 1h contradiction, C6, the review back button, the one-row offline model line, the Home, review, analysing and READY-result arrangement, both unmet Test policy rows, and the round-1 precision gaps. The feature still fails on these counts:

- **Two arrangements no check covers.** The inconclusive result card (1h) and the state screens (1q) are compositions of their own, and no check asserts their order.
- **Three checks claim a position nothing asserts.** C40 ("foto no topo"), C43 ("no rodapé") and C57 ("no topo do cartão"). This is the same pattern that failed C6 in round 1.
- **The round-1 surviving mutant was not re-run.** The assertion that should kill it now exists (C56), but no E2E fault could run this round. The `agro_vision` Docker stack was stopped mid-verification by a `docker compose stop` that this agent did not issue.
- **Unproven coverage members.** The "Carregando modelo..." screen is never checked for the forbidden vocabulary (named in round 1, still open). Four design icons on touched screens have no check.

## Round 1 findings

Status of every round-1 verdict that was not PASS, at `e4d8194`.

| Round 1 finding | Closed? | Evidence |
| --- | --- | --- |
| 1h contradiction (Modelo/Data/aviso on every result) | yes | AC 34 revised, AC 37 added (`plan.md:133`, `:136`); rows and disclaimer guarded by `!inconclusive` at `app/analisar/result-view.tsx:98` and `:123`; C40 `tests/e2e/avaliacao.spec.ts:377-379` |
| C6 "abaixo do cartão" unasserted | yes | `tests/e2e/home.spec.ts:73` - `expect((await status.boundingBox())!.y).toBeGreaterThanOrEqual(card.y + card.height)` |
| 1d back button missing | yes | rendered at `components/guided-camera.tsx:445-452`; C41 `avaliacao.spec.ts:386-396` |
| 1e footer model line unchecked | partly | presence C43 `avaliacao.spec.ts:410-411`; its position at the bottom is still unasserted (see C43) |
| 1b one-row model line | yes | `app/(tabs)/model-status.tsx:32-42`; C42 `home.spec.ts:95-96` |
| Arrangement: Home, review, analysing, result | partly | Home C53, review C54, analysing C55, READY result C56 are proven; the 1h card and the 1q states are not (Binding sources) |
| Surviving mutant, INCONCLUSIVE fill | assertion added, mutant not re-run | C56 `avaliacao.spec.ts:572` - `expect(fill).toHaveCSS("background-color", rgb("#E8A93A"))`; fault 3 below was built but could not be served |
| Test policy "Entry point", `?de=` guard | yes | guard extracted to `lib/evaluation/origin.ts:3-5`; C49 six cases `tests/unit/origin.test.ts:6-13`; C50 at the boundary `avaliacao.spec.ts:462`; fault 1 killed |
| Test policy "Decides, across a boundary", `loadClassifier` error/retry | yes | C51 `tests/unit/classifier.test.ts:43-46`, `:53-55`; fault 2 killed |
| Unproven: `classify()` rejection | yes | C46 `avaliacao.spec.ts:419-420` |
| Unproven: Home loading / error states | yes | C44 `home.spec.ts:104`, `:106`; C45 `home.spec.ts:112` |
| Unproven: image-error "Tirar outra foto", state-screen "Fechar" | yes | C48 `avaliacao.spec.ts:456-457`; C47 `avaliacao.spec.ts:425-430` on three screens |
| Unproven: AC 35 / AC 36 on state and camera-denied screens | partly | C52 `avaliacao.spec.ts:467-468` covers model-unavailable, load error, image error and camera denied. "Carregando modelo..." is still never checked for vocabulary |
| Precision: mark position, 94% width, 62% | yes | C56 `avaliacao.spec.ts:575`, `:564`, `:570` |
| Remaining icons (Home circle and buttons, replay, result `photo_camera`, tips, Galeria, spinner, state icons) | yes | C57 `avaliacao.spec.ts:582-595`; C58 `:603-638` |
| Code-only "Fechar" on 1q state screens | yes | recorded deviation `plan.md:166` (Assumptions); C47 |

## Binding sources

Verified at `e4d8194` for the screens the fix touched (1a, 1b, 1d, 1e, 1f/1g, 1h, 1q). 1c is carried from `0e47007`, except the Galeria tile (now C57).

Source: Claude Design project "Gado Certo UI mockups", file `Gado Certo - Telas.dc.html` (project `96e99ff6-cd1e-4d21-b9d1-afca323c5bc7`). I opened it in this round with `mcp__claude-design__read_file`: lines 220-444 (1a-1h), 444-463 (1i, to locate 2e; 2e is not in this file) and 680-723 (1q and the renderers).

The plan's recorded deviations are not counted: logo and title, no farm subtitle, no flash, no offline banner, pending badge or sync line, no "Salvar mesmo assim" / "Ver detalhes" / "Status" / animal chip, the model-unavailable screen, and the 1q "Fechar". Elements that are unconditional and shared by all three decisions count as covered where any decision asserts them: the 1h `close` icon (`result-view.tsx:34-40`, asserted by C36 `:357`) and the `photo_camera` on "Nova avaliação" for NOT_READY (`result-view.tsx:114-122`, asserted by C58 `:616`).

| Source | Opened | Contradiction | Uncovered |
| --- | --- | --- | --- |
| design 1a Home online | yes - read_file, lines 224-256 | none | (1) The card icon circle "no topo do cartão": C57 asserts size, colour and fill (`avaliacao.spec.ts:582-585`), but locates `home-card-icon` page-wide (`:580`) and never compares it with `home-card`; C53 leaves it out of the containment list (`home.spec.ts:129`). (2) The `offline_bolt` icon on the installed-model line "IA disponível offline" (`model-status.tsx:49`): no check (C7 `home.spec.ts:80-81` asserts text only). |
| design 1b Home offline | yes - read_file, lines 257-290 | none | The `offline_bolt` icon in the one-row line (`model-status.tsx:35`): no check (C42 asserts the label and version only). Not counted: 1b's 68 px circle and tighter margins exist to fit the offline banner, which the plan's Out of scope excludes. |
| design 1c Captura | carried from 0e47007 - read_file, lines 291-325 | none | - (Galeria `photo_library` and caption now C57 `avaliacao.spec.ts:591-592`) |
| design 1d Revisão | yes - read_file, lines 326-342 | none | The `smartphone` icon on "A análise é realizada no seu dispositivo." and the `cloud_off` icon on "Sem internet — a análise continuará normalmente." (`app/analisar/evaluation-flow.tsx:208`, `:213`): no check. Back button, photo above the sheet, sheet order and `replay` are covered (C41, C54, C57). |
| design 1e Analisando | yes - read_file, lines 343-361 | none | Footer position: the design draws the `memory` line at the bottom of the screen (`bottom:40px`), and the code puts it there (`evaluation-flow.tsx:245`, `absolute inset-x-0 bottom-10`). But C43 asserts only visibility (`avaliacao.spec.ts:410-411`), and C55's order list stops at the indeterminate bar (`:522-527`). |
| design 1f / 1g Resultado pronto / não pronto | yes - read_file, lines 365-412 | none | - (card overlap and order C56 `:545`, `:558`; 94% C56 `:564`; icons C31, C32, C58) |
| design 1h Resultado inconclusivo | yes - read_file, lines 413-441 | none - the round-1 contradiction is closed (AC 34 / AC 37, `result-view.tsx:98`, `:123`, C40) | Arrangement: 1h draws its own card order (decision block → 62% → bar with mark → "mínimo 85%" → message → tips box → "Tirar outra foto") and the card overlapping the 230 px photo. The code renders that structure behind `inconclusive` conditionals (`result-view.tsx:31`, `:76-95`, `:98`). No check orders it: C56 orders the READY card only (`avaliacao.spec.ts:547-558`), and C33 / C58 assert presence and the order of the tips among themselves. The photo at the top is claimed by C40 but not asserted (`:375` reads `src` only). |
| design 1q estados (carregando / erro / imagem inválida) | yes - read_file, lines 690-697 | none | Arrangement: every 1q card is one centred column, icon circle → title → text → action, and the loading card is spinner → title → text. The code follows it (`StateScreen`, `evaluation-flow.tsx:271-284`; loading `:134-138`), but no check asserts the order on any of the four state screens. C47, C52 and C58 assert the close link, vocabulary and touch, and the icons and colours. Covered: spinner `animation-name` C58 `:623`, `report` / `#FAEBE8` C58 `:631-632`, `image_not_supported` / `#FBF1DE` C58 `:637-638`. |

## Checks

Verified at `e4d8194`. All 58 named tests exist and ran individually at HEAD, in two invocations:

- **Unit.** `pnpm vitest run tests/unit/decision.test.ts tests/unit/classifier.test.ts tests/unit/origin.test.ts --reporter=verbose`: exit 0, 17 passed. C49 ran as six `it.each` cases under "origem do cancelar", each listed as passed.
- **E2E.** `pnpm playwright test tests/e2e/home.spec.ts tests/e2e/avaliacao.spec.ts`: exit 0, 51 passed (3.8m). The run built Next and served it on port 3100; nothing was listening there beforehand. C35 ran as "nova avaliacao volta para a camera (pronto)" and "(nao pronto)", both passed.

| Check | Claim | Proof run | Evidence | Result |
| --- | --- | --- | --- | --- |
| C1 | `/` is the Home, no redirect | E2E, "raiz abre a home" passed | `tests/e2e/home.spec.ts:12` - `expect(page.getByRole("heading", { name: "Analisar animal" })).toBeVisible()`; `:13` - `expect(page).toHaveURL(/^http:\/\/[^/]+\/$/)` | PASS |
| C2 | logo 36 px, "AgroVision" 18 px / 700, chip to the right | E2E, "topo da home" passed | `tests/e2e/home.spec.ts:20` - `expect(Math.round((await logo.boundingBox())!.width)).toBe(36)`; `:22-23` - `toHaveCSS("font-size", "18px")`, `toHaveCSS("font-weight", "700")`; `:26` - `expect(chipBox.x).toBeGreaterThan(titleBox.x + titleBox.width)` | PASS |
| C3 | chip "Online", `#EAF5EF` / `#154C35` / dot `#18864B` | E2E, "chip online" passed | `tests/e2e/home.spec.ts:32-35` - `toHaveText("Online")`, `rgb("#EAF5EF")`, `rgb("#154C35")`, `online-dot` `rgb("#18864B")` | PASS |
| C4 | chip "Offline", `cloud_off`, `#EEF0EF` / `#3C4641` | E2E, "chip offline" passed | `tests/e2e/home.spec.ts:42-45` - `toContainText("Offline")`, `locator('[data-icon="cloud_off"]')).toBeVisible()`, `rgb("#EEF0EF")`, `rgb("#3C4641")` | PASS |
| C5 | intro before card; card 26 px / 700; buttons 60 px `#1F6B45` and 56 px `#EAF5EF` | E2E, "cartao analisar animal" passed | `tests/e2e/home.spec.ts:53` - `expect((await intro.boundingBox())!.y).toBeLessThan(...)`; `:54-55`; `:58-59` - `toBe(60)`, `rgb("#1F6B45")`; `:61-62` - `toBe(56)`, `rgb("#EAF5EF")` | PASS |
| C6 | no model: line below the card, `offline_bolt` `#68736D`, no "IA disponível offline" | E2E, "sem modelo na home" passed | `tests/e2e/home.spec.ts:68` - `toHaveText(/Modelo de IA ainda não disponível/)`; `:69` - `toHaveCSS("color", rgb("#68736D"))`; `:70` - `toHaveCount(0)`; `:73` - `expect((await status.boundingBox())!.y).toBeGreaterThanOrEqual(card.y + card.height)` | PASS |
| C7 | hook v1.4.0: "IA disponível offline" and "Modelo instalado: v1.4.0" | E2E, "modelo instalado na home" passed | `tests/e2e/home.spec.ts:80-81` - `toContainText("IA disponível offline")`, `toContainText("Modelo instalado: v1.4.0")` | PASS |
| C8 | Home tab `aria-current`, `href="/"`; from `/animais` opens `/`; `/inicio` 404 | E2E, "aba home" passed | `tests/e2e/home.spec.ts:143-144` - `toHaveAttribute("aria-current", "page")`, `toHaveAttribute("href", "/")`; `:147` - `toHaveURL(/^http:\/\/[^/]+\/$/)`; `:148` - `expect((await request.get("/inicio")).status()).toBe(404)` | PASS |
| C9 | "Tirar foto" opens the camera with frame, prompt and four tips | E2E, "tirar foto abre a camera de avaliacao" passed | `tests/e2e/avaliacao.spec.ts:46-47` - `guide-frame` and prompt `toBeVisible()`; `:48` - `toHaveText(["Fotografe de lado", "Boa iluminação", "Só um animal", "Corpo inteiro"])` | PASS |
| C10 | centre bar button opens the camera | E2E, "botao central abre a camera" passed | `tests/e2e/avaliacao.spec.ts:54-55` - `toHaveURL(/\/analisar/)`, `shutter` `toBeVisible()` | PASS |
| C11 | camera layout, no position / distance chips | E2E, "layout da camera de avaliacao" passed | `tests/e2e/avaliacao.spec.ts:63-67` - Cancelar `x < vw / 2`, `y < vh / 6`, chip `x > vw / 2`; `:71` - `toBe(88)`; `:72-74` - `gallery.x < shutter.x`, `tips.x > shutter.x + shutter.width`, `y > 2vh / 3`; `:75-76` - `camera-position` / `min-distance` `toHaveCount(0)` | PASS |
| C12 | no bar on camera, review, analysis, result | E2E, "fluxo sem barra inferior" passed | `tests/e2e/avaliacao.spec.ts:82`, `:84`, `:87`, `:90` - `expect(page.locator(nav)).toHaveCount(0)` | PASS |
| C13 | Home gallery `accept="image/*"`, then `/analisar` review with the photo | E2E, "galeria da home vai para a revisao" passed | `tests/e2e/avaliacao.spec.ts:98` - `expect(await fc.element().getAttribute("accept")).toBe("image/*")`; `:100-102` - `toHaveURL(/\/analisar/)`, `review` visible, `review-photo` `toHaveAttribute("src", /^blob:/)` | PASS |
| C14 | camera "Galeria" `accept="image/*"`, then review | E2E, "galeria da camera vai para a revisao" passed | `tests/e2e/avaliacao.spec.ts:110` - `toBe("image/*")`; `:112-113` - `review` visible, `src` `/^blob:/` | PASS |
| C15 | `NotAllowedError`: message, "Tentar novamente", Galeria still opens the chooser | E2E, "permissao negada mantem a galeria" passed | `tests/e2e/avaliacao.spec.ts:121-122` - text and button `toBeVisible()`; `:124-126` - Galeria click, `filechooser`, `review` visible | PASS |
| C16 | review layout | E2E, "layout da revisao de avaliacao" passed | `tests/e2e/avaliacao.spec.ts:133` - heading visible; `:135-137` - `toBe(60)`, `center_focus_strong` visible, `rgb("#1F6B45")`; `:139-141` - `toBe(56)`, `rgb("#EAF5EF")`, note visible | PASS |
| C17 | offline review line, "Analisar imagem" enabled | E2E, "revisao offline" passed | `tests/e2e/avaliacao.spec.ts:149-150` - text `toBeVisible()`, `toBeEnabled()` | PASS |
| C18 | "Tirar outra foto" back to the camera | E2E, "tirar outra volta para a camera" passed | `tests/e2e/avaliacao.spec.ts:158-159` - `review` `toHaveCount(0)`, `shutter` `toBeEnabled()` | PASS |
| C19 | Cancelar returns to the origin; opened direct, returns to `/` | E2E, "cancelar volta para a origem" passed | `tests/e2e/avaliacao.spec.ts:165`, `:169` - `expect(page).toHaveURL(ROOT)`; `:174` - `toHaveURL(/\/animais$/)` | PASS |
| C20 | no `/api/` request, camera and gallery, up to the result | E2E, "nenhuma chamada a api" passed | `tests/e2e/avaliacao.spec.ts:191` - `expect(api).toEqual([])` after results at `:187` and `:190` | PASS |
| C21 | analysing screen, no `%` | E2E, "tela analisando" passed | `tests/e2e/avaliacao.spec.ts:202-206` - heading, text, `analyzing-photo`, `scan-line`, `indeterminate-bar` visible; `:207` - `expect(screen).not.toContainText("%")` | PASS |
| C22 | "Carregando modelo..." then the result on release | E2E, "carregando modelo" passed | `tests/e2e/avaliacao.spec.ts:216-217` - both texts visible; `:219` - `decision-block` `toContainText("PRONTO PARA ABATE")` | PASS |
| C23 | no model: copy, "Voltar ao início" goes to `/`, no decision and no `%` | E2E, "sem modelo nao inventa resultado" passed | `tests/e2e/avaliacao.spec.ts:227-230`; `:232-234` - `not.toContainText("PRONTO")`, `("INCONCLUSIVO")`, `("%")`; `:236` - `toHaveURL(ROOT)` | PASS |
| C24 | load error copy; retry reaches the result | E2E, "erro ao carregar o modelo" passed | `tests/e2e/avaliacao.spec.ts:244-245` - texts visible; `:247-248` - "Tentar novamente" click, then `decision-block` `toBeVisible()` | PASS |
| C25 | undecodable `quebrada.jpg`: error copy and "Tirar outra foto" | E2E, "imagem que nao decodifica" passed | `tests/e2e/avaliacao.spec.ts:253` - fixture; `:255-257` - texts and button `toBeVisible()` | PASS |
| C26 | 0.85 / 0.15 at 0.85 decides READY | unit, "pronto no limiar" passed | `tests/unit/decision.test.ts:8` - `expect(decide({ ready: 0.85, notReady: 0.15 }, T85)).toBe("READY")` | PASS |
| C27 | 0.06 / 0.94 decides NOT_READY | unit, "nao pronto acima do limiar" passed | `tests/unit/decision.test.ts:12` - `expect(decide({ ready: 0.06, notReady: 0.94 }, T85)).toBe("NOT_READY")` | PASS |
| C28 | 0.62 / 0.38 decides INCONCLUSIVE | unit, "inconclusivo abaixo dos dois limiares" passed | `tests/unit/decision.test.ts:16` - `toBe("INCONCLUSIVE")` | PASS |
| C29 | 0.88 is READY at 0.85 and INCONCLUSIVE at 0.90 | unit, "limiar vem do modelo" passed | `tests/unit/decision.test.ts:21-22` - `toBe("READY")`, `toBe("INCONCLUSIVE")` | PASS |
| C30 | truncation gives 91 and 84 | unit, "confianca truncada" passed | `tests/unit/decision.test.ts:34-35` - `toBe(91)`, `toBe(84)` | PASS |
| C31 | READY block, icon, label, 91%, bar colour and width | E2E, "resultado pronto" passed | `tests/e2e/avaliacao.spec.ts:266-269` - `rgb("#18864B")`, `check_circle`, "PRONTO PARA ABATE", `toHaveText(/91%\s*de confiança/)`; `:271-272` - fill `rgb("#18864B")`, `toHaveAttribute("style", /width:\s*91%/)` | PASS |
| C32 | NOT_READY block, icon, label, 94%, bar colour | E2E, "resultado nao pronto" passed | `tests/e2e/avaliacao.spec.ts:281-285` - `rgb("#C74A3A")`, `cancel`, "NÃO PRONTO PARA ABATE", `toContainText("94%")`, fill `rgb("#C74A3A")`. The 94% width is asserted by C56 `:564` | PASS |
| C33 | INCONCLUSIVE block, text colour, icon, label, mark "mínimo 85%", message, three tips | E2E, "resultado inconclusivo" passed | `tests/e2e/avaliacao.spec.ts:294-299` - `rgb("#E8A93A")`, `rgb("#2E2206")`, `help`, label, `threshold-mark` visible, "mínimo 85%" visible; `:303-307` - tips `toHaveText([...])`. Fill and mark position are asserted by C56 `:572`, `:575` | PASS |
| C34 | inconclusive primary "Tirar outra foto" goes to the camera | E2E, "inconclusivo tira outra foto" passed | `tests/e2e/avaliacao.spec.ts:316-319` - `toHaveAttribute("data-primary-action")`, `rgb("#1F6B45")`, click, then `shutter` `toBeEnabled()` | PASS |
| C35 | READY / NOT_READY primary "Nova avaliação" goes to the camera | E2E, "nova avaliacao volta para a camera (pronto)" and "(nao pronto)" passed | `tests/e2e/avaliacao.spec.ts:332-335` - `data-primary-action`, `rgb("#1F6B45")`, click, then `shutter` `toBeEnabled()` | PASS |
| C36 | READY and NOT_READY: photo on top, "Modelo" / "Data" rows, disclaimer, close goes to `/` | E2E, "dados do resultado" passed | the loop over both decisions at `tests/e2e/avaliacao.spec.ts:343-357`: `:353` - `expect((await photo.boundingBox())!.y).toBeLessThan(10)`; `:354` - `toHaveText(/Modelo\s*CattleClassifier v1\.4\.0/)`; `:355` - `toHaveText(/Data\s*25 out 2026, 09:42/)`; `:356` - disclaimer visible; `:357` - `close` icon visible; `:363-364` - Fechar click, `toHaveURL(ROOT)` | PASS |
| C37 | no "autorizado" / "aprovado" on Home, camera, review, analysis, 3 results | E2E, "vocabulario proibido" passed | `tests/e2e/avaliacao.spec.ts:668` - `expect(t).not.toMatch(...)` with the case-insensitive regex for `autorizad` or `aprovad`, over texts grabbed at `:646`, `:649`, `:657`, `:660`, `:663` | PASS |
| C38 | at least 44 × 44 everywhere; primary actions 56-60 px on Home, camera, review, result | E2E, "areas de toque do fluxo" passed | `tests/e2e/helpers.ts:98-103` - `expect.soft(t.w).toBeGreaterThanOrEqual(44)`, `(t.h)` at least 44, primary at least 56 and at most 60; `:105` - `report.length > 0`; called at `tests/e2e/avaliacao.spec.ts:674`, `:677`, `:679`, `:682` | PASS |
| C39 | `loadClassifier()` rejects with `ModelUnavailableError` without the hook, resolves the hook's classifier with it | unit, "sem gancho rejeita..." and "com gancho resolve..." passed | `tests/unit/classifier.test.ts:27` - `await expect(loadClassifier()).rejects.toBeInstanceOf(ModelUnavailableError)`; `:33` - `resolves.toBe(fake)` | PASS |
| C40 | inconclusive: photo **on top**, close button, no `result-model` / `result-date`, no disclaimer | E2E, "inconclusivo sem modelo e data" passed | `tests/e2e/avaliacao.spec.ts:377-378` - `result-model` / `result-date` `toHaveCount(0)`; `:379` - disclaimer `toHaveCount(0)`; `:376` - Fechar `toBeVisible()`. "no topo" has no assertion: `:375` reads only `toHaveAttribute("src", /^blob:/)`. Search: `result-photo` appears at `:351`, `:375` and `:544`; the position reads at `:353` and `:544` run on READY / NOT_READY only | FAIL - position claim unproven |
| C41 | review "Voltar" with `arrow_back`, 44 × 44, top left over the photo, goes back to the camera; same on the Home-gallery review | E2E, "voltar da revisao" passed | `tests/e2e/avaliacao.spec.ts:386` - `arrow_back` visible; `:389-390` - `toBe(44)`, `toBe(44)`; `:391` - `b.x < vw / 2`; `:392-393` - `b.y >= photo.y`, `b.y + b.height <= photo.y + photo.height / 3`; `:395-396` - `review` `toHaveCount(0)`, `shutter` `toBeEnabled()`; gallery path `:399-401` | PASS - precision gap: on the gallery review only the tap behaviour is re-asserted, and AC 38's "fundo branco" is not in the check |
| C42 | offline with v1.4.0: "IA disponível offline" and "Modelo v1.4.0" on one row, version on the right | E2E, "modelo offline em uma linha" passed | `tests/e2e/home.spec.ts:91-92` - `toHaveText("IA disponível offline")`, `toHaveText("Modelo v1.4.0")`; `:95` - `expect(Math.abs(l.y + l.height / 2 - (v.y + v.height / 2))).toBeLessThan(4)`; `:96` - `expect(v.x).toBeGreaterThan(l.x + l.width)` | PASS |
| C43 | analysing **footer** shows `memory` and "CattleClassifier v1.4.0 · no dispositivo" | E2E, "rodape da analise" passed | `tests/e2e/avaliacao.spec.ts:410` - footer text `toBeVisible()`; `:411` - `memory` `toBeVisible()`. "no rodapé" has no assertion: the test body (`:404-412`) reads no box, and C55's order list (`:522-527`) omits the footer | FAIL - position claim unproven |
| C44 | load pending: Home shows no `model-status`; on release, "IA disponível offline" | E2E, "home espera o modelo" passed | `tests/e2e/home.spec.ts:104` - `expect(page.getByTestId("model-status")).toHaveCount(0)`; `:106` - `toContainText("IA disponível offline")` | PASS |
| C45 | hook rejects with a plain error: Home shows "Modelo de IA ainda não disponível" | E2E, "falha do modelo na home" passed | `tests/e2e/home.spec.ts:112` - `toHaveText(/Modelo de IA ainda não disponível/)` | PASS |
| C46 | `classify` rejects: "Erro ao carregar o modelo" and "Tentar novamente" | E2E, "classificacao que falha" passed | `tests/e2e/avaliacao.spec.ts:419-420` - text and button `toBeVisible()` | PASS |
| C47 | state screens: "Fechar" with `close`, 44 × 44, goes to `/` | E2E, "fechar nas telas de estado" passed | `tests/e2e/avaliacao.spec.ts:425` - `close` icon visible; `:427-428` - `toBe(44)`; `:430` - `toHaveURL(ROOT)`; run on `model-unavailable` `:437-438`, `image-error` `:442-443`, `model-error` `:449-450` | PASS |
| C48 | image error "Tirar outra foto" goes to the camera | E2E, "foto invalida volta para a camera" passed | `tests/e2e/avaliacao.spec.ts:456-457` - click, then `shutter` `toBeEnabled()` | PASS |
| C49 | `safeOrigin`: `/` for `//evil.com`, `/\evil.com`, `https://evil.com`, `undefined`, `["/animais", "/"]`; `/animais` for `/animais` | unit, six cases under "origem do cancelar" passed | `tests/unit/origin.test.ts:13` - `expect(safeOrigin(de)).toBe(expected)` over the table at `:6-11` | PASS |
| C50 | `/analisar?de=//evil.com`: Cancelar `href="/"` | E2E, "cancelar recusa outro site" passed | `tests/e2e/avaliacao.spec.ts:462` - `toHaveAttribute("href", "/")` | PASS |
| C51 | one failure, then the next call re-calls the hook and resolves; two successes call the hook once | unit, both tests under "nova tentativa e reaproveitamento" passed | `tests/unit/classifier.test.ts:43-44` - `rejects.toThrow("falha simulada")`, `rejects.not.toBeInstanceOf(ModelUnavailableError)`; `:45-46` - `resolves.toBe(fake)`, `toHaveBeenCalledTimes(2)`; `:53-55` - `toHaveBeenCalledTimes(1)` | PASS |
| C52 | state screens and camera denied: no forbidden words; every control at least 44 × 44 | E2E, "telas de estado sem vocabulario proibido e com toque" passed | `tests/e2e/avaliacao.spec.ts:467` - `body` `innerText` `not.toMatch(...)` (same regex as C37); `:468` - `assertTouchTargets` (`tests/e2e/helpers.ts:98-105`); run after `:473`, `:478`, `:485`, `:492` | PASS |
| C53 | Home: title, subtitle, both buttons inside the card; "Tirar foto" above the gallery button; model line below the card, with and without a model | E2E, "arranjo da home" passed | `tests/e2e/home.spec.ts:129` - `expect(inside(card, b)).toBe(true)` for heading, subtitle, shoot, gallery; `:130` - `expect(shoot.y + shoot.height).toBeLessThanOrEqual(gallery.y)`; `:131`, `:137` - `model-status` `y` at or below the card bottom | PASS |
| C54 | review: photo above the sheet; sheet order question, analyse, retake, note | E2E, "arranjo da revisao" passed | `tests/e2e/avaliacao.spec.ts:502-503` - `photo.y < s.y`, `photo.y + photo.height <= s.y + 30`; `:513` - `expect([...ys].sort((a, b) => a - b)).toEqual(ys)` | PASS |
| C55 | analysing order thumbnail, title, text, bar, all centred | E2E, "arranjo da analise" passed | `tests/e2e/avaliacao.spec.ts:533` - `expect(Math.abs(b.x + b.width / 2 - vw / 2)).toBeLessThan(2)`; `:535` - sorted `ys` `toEqual(ys)` | PASS |
| C56 | READY card overlaps the photo, order of 7; NOT_READY bar 94%; INCONCLUSIVE 62%, fill `#E8A93A`, mark at 85% | E2E, "arranjo e valores do resultado" passed | `tests/e2e/avaliacao.spec.ts:545` - `expect(card.y).toBeLessThan(photo.y + photo.height)`; `:558` - sorted `ys` `toEqual(ys)`; `:564` - `toHaveAttribute("style", /width:\s*94%/)`; `:570` - `toHaveText(/62%\s*de confiança/)`; `:572` - `toHaveCSS("background-color", rgb("#E8A93A"))`; `:575` - `expect(Math.abs(mark.x - bar.x - 0.85 * bar.width)).toBeLessThan(2)` | PASS |
| C57 | Home 76 px circle, `#EAF5EF`, filled `photo_camera` **at the top of the card**; button icons; Galeria icon and caption; review `replay` | E2E, "icones da home, camera e revisao" passed | `tests/e2e/avaliacao.spec.ts:582-583` - `toBe(76)`; `:584` - `rgb("#EAF5EF")`; `:585` - `toHaveClass(/icon-fill/)`; `:586-587` - `photo_camera`, `photo_library`; `:591-592` - Galeria icon and caption; `:595` - `replay`. "no topo do cartão" has no assertion: `home-card-icon` is located page-wide (`:580`), and no read compares it with `home-card` (search: `home-card-icon` appears only at `:580`) | FAIL - position claim unproven |
| C58 | result primary `photo_camera`; tips icons in order in a `#FBF4E6` box; spinner `spin`; `report` in `#FAEBE8`; `image_not_supported` in `#FBF1DE` | E2E, "icones do resultado e dos estados" passed | `tests/e2e/avaliacao.spec.ts:603`, `:616` - `photo_camera` visible on the inconclusive and READY primaries; `:605` - `rgb("#FBF4E6")`; `:606-610` - `toEqual(["open_in_full", "wb_shade", "swap_horiz"])`; `:623` - `toHaveCSS("animation-name", "spin")`; `:631-632` - `rgb("#FAEBE8")`, `report`; `:637-638` - `rgb("#FBF1DE")`, `image_not_supported` | PASS |

Notes:

- **Swept, existing.** Carried from `0e47007` and re-read at HEAD: `components/guided-camera.tsx:297` still renders "Carregando guia de enquadramento...".
- **Handoff wording.** The Handoff says C32 and C33 were "tightened". Their text and tests are unchanged (`avaliacao.spec.ts:275-308`); the 94% width, the INCONCLUSIVE fill and the mark position live in C56.
- **Precedence rule.** Still proven only by the unlabelled test `tests/unit/decision.test.ts:25-29` (green), carried from round 1.
- **Blast radius outside this feature.** `PhotoReview` is shared, so the new back button also renders on the F1 photo reviews (`app/animais/novo/photo-field.tsx:188`, `app/animais/[id]/fotos/[posicao]/camera-capture.tsx:20`, both through `GuidedCamera`). The F1 specs (`cadastro`, `camera`, `visual`) were not run this round, and the F1 design (2e) is not in this feature's binding file. The Handoff reports the full E2E suite at 116 passed.

## Coverage

Each row says whether it was recomputed at `e4d8194` or carried from `0e47007`.

| Set (size) | Recomputed from | Member -> proof | Unproven |
| --- | --- | --- | --- |
| `Decision` values (3) - carried from 0e47007 | `lib/evaluation/decision.ts:4` (untouched) | READY C26 · NOT_READY C27 · INCONCLUSIVE C28 | - |
| `decide` table rows (5) - carried from 0e47007 | `lib/evaluation/decision.ts:6-13` | READY only C26 · NOT_READY only C27 · neither C28 · both, either side wins `decision.test.ts:27-28` | - |
| threshold source (2) - carried from 0e47007 | `Classifier.model.threshold` (plan door 1) | 0.85 and 0.90 C29 | - |
| confidence truncation (2) - carried from 0e47007 | `lib/evaluation/decision.ts:19` | 91 and 84 C30 | - |
| decision look on screen (3 decisions × label / icon / block / fill = 12) - verified at e4d8194 | `app/analisar/result-view.tsx:8-12` (`LOOK`) | READY 4/4 C31 · NOT_READY 4/4 C32 · INCONCLUSIVE label, icon, block C33 and fill C56 `avaliacao.spec.ts:572` | - |
| analysis outcomes (8) - verified at e4d8194 | `runAnalysis`, `app/analisar/evaluation-flow.tsx:40-77` | analysing C21 · decode fails C25 · loading C22 · `ModelUnavailableError` C23 · other load error C24 · retry after error C24 · `classify` rejects C46 · result C31 | - |
| model status on Home (5) - verified at e4d8194 | `app/(tabs)/model-status.tsx:29`, `:32`, `:46`, `:56` + plan Observable (loading, error) | querying C44 · no model C6 · installed online C7 · installed offline C42 · load failure C45 | - |
| result details per decision (3 decisions × {Modelo / Data / disclaimer, photo on top}) - verified at e4d8194 | AC 34, AC 37; `result-view.tsx:31-41`, `:98`, `:123` | READY rows, disclaimer and photo C36 `:353-356` · NOT_READY same loop C36 · INCONCLUSIVE without rows and disclaimer C40 `:377-379` | INCONCLUSIVE photo on top (AC 37): no position assertion (C40 `:375` reads `src` only) |
| `de` guard inputs (6 + boundary) - verified at e4d8194 | AC 45; `lib/evaluation/origin.ts:4` | `//host`, `/\host`, `https://host`, absent, repeated, internal path C49 `origin.test.ts:6-11` · boundary `//evil.com` C50 `:462` · `?de=/` and `?de=/animais` C19 | - |
| forbidden-vocabulary screens (AC 35 "nenhuma tela do fluxo", 12) - verified at e4d8194 | `Step` union `evaluation-flow.tsx:21-29` + Home + camera denied | Home, camera, review, analysing, 3 results C37 · model unavailable, load error, image error, camera denied C52 | "Carregando modelo..." (`loading-model`, `evaluation-flow.tsx:132-139`): no proof reads its text. C37 (`:641-669`) and C52 (`:465-494`) never stop on it, and C22 (`:216-217`) asserts presence only. Round 1 named this member; the round-2 Coverage row in `checks.md` dropped it |
| touch-target screens (AC 36, screens with controls) - verified at e4d8194 | same union; `loading-model` and `analyzing` have no controls | Home, camera, review, result C38 · model unavailable, load error, image error, camera denied C52 · back button 44 × 44 C41 | - |
| arrangement per screen (design authority: 1a, 1b, 1c, 1d, 1e, 1f, 1g, 1h, 1q × 4) - verified at e4d8194 | design file, lines 224-441 and 690-697 | 1a C53 · 1b one-row C42 · 1c C11 · 1d C54 and C41 · 1e C55 · 1f C56 · 1g C56 (same structure) | 1a circle at the top of the card · 1e footer at the bottom · 1h card order and overlap · 1q order on model unavailable, load error, image error, loading |
| icons per screen (design authority) - verified at e4d8194 | design file, same lines | 1a circle, `photo_camera`, `photo_library` C57 · 1b chip `cloud_off` C4 · 1c Galeria C57 · 1d `arrow_back` C41, `center_focus_strong` C16, `replay` C57 · 1e `memory` C43 · 1f/1g `check_circle` C31, `cancel` C32, `photo_camera` C58, `close` C36 · 1h `help` C33, `photo_camera`, tips C58 · 1q spinner, `report`, `image_not_supported` C58 | `offline_bolt` on the installed line (1a, `model-status.tsx:49`) and the one-row line (1b, `:35`) · `smartphone` and `cloud_off` on the review notes (1d, `evaluation-flow.tsx:208`, `:213`) |
| connection state on Home and review (4) - carried from 0e47007 | `components/connection-chip.tsx`, `evaluation-flow.tsx:211` | Home online C3 · Home offline C4 · review online C16 · review offline C17 | - |
| entries into the flow (6) - carried from 0e47007 | `app/(tabs)/page.tsx`, `components/tab-bar.tsx`, `gallery-button.tsx`, `guided-camera.tsx` | C9 · C10 · C13 · C14 · direct `/analisar` C19 / C22 · gallery on a denied camera C15 | - |
| flow transitions (14) - verified at e4d8194 | `evaluation-flow.tsx`, `result-view.tsx`, `guided-camera.tsx:445-452` | camera → review C16 · review → camera, retake C18 · review → camera, back C41 · review → analysis C21 · inconclusive → camera C34 · result → camera C35 · result → `/` C36 · unavailable → `/` C23 · image error → camera C48 · state screens → `/` C47 · camera → origin C19 · gallery → review C13 / C14 · load error → retry C24 · loading → result C22 | - |
| screens without the bar - carried from 0e47007 | the only TabBar mount is `app/(tabs)/layout.tsx:9`; `/analisar` is outside the group | camera, review, analysis, result C12 | - |
| Landing doors (3) - verified at e4d8194 | plan Landing | 1 classifier C39, C51, C7, C23 · 2 vocabulary C26-C28 · 3 routes C1, C8, C12 | - |
| entities (0) - carried from 0e47007 | plan Relations: none | - | - |
| startup config (1 assembly) - verified at e4d8194 | the only read of the hook is `lib/evaluation/classifier.ts:32`; the only writes are `tests/e2e/helpers.ts:140` and `tests/unit/classifier.test.ts:31`, `:40`, `:51` | absent in the shipped app C23 · present only in tests C7 | - |

## Test policy rows

Rows 1, 3 and 4 were re-judged at `e4d8194` (the two unmet in round 1, plus rows classifying touched files). Row 2 is carried from `0e47007`.

| Row | Files it classifies | Required proof | Expectation met |
| --- | --- | --- | --- |
| Decides, reached across a boundary | `lib/evaluation/decision.ts`, `lib/evaluation/classifier.ts` (`loadClassifier`), `lib/evaluation/origin.ts` (`safeOrigin`, new), `app/(tabs)/model-status.tsx`, `app/analisar/evaluation-flow.tsx` (`runAnalysis`), `app/analisar/result-view.tsx` (details per decision) | boundary + own layer, one case per table row at the own layer | yes - `decide` / `confidencePercent`: 5 rows at the own layer plus C31-C33, C56. `loadClassifier`: hook, unavailable, error with retry and reuse at the own layer (C39 `classifier.test.ts:27`, `:33`; C51 `:43-46`, `:53-55`), boundary C7, C23, C24, C45. `safeOrigin`: 6 rows C49 plus boundary C50. The UI components have every branch asserted at the boundary (Coverage rows "model status on Home", "analysis outcomes", "result details"); the repo has no component-test layer, which is the reading round 1 applied |
| Decides, not reached across a boundary | nothing in this diff | own layer | n/a - nothing classified |
| Entry point that decides nothing | `app/analisar/page.tsx` (now passes `safeOrigin(de)`, `:6-7`), `app/(tabs)/page.tsx`, `app/(tabs)/gallery-button.tsx` | boundary: accepted input, each rejected input, each error path | yes - accepted C1, C13, C19; rejected `//evil.com` at the boundary C50, and every rejected form at the decision's own layer C49 (the decision moved into `origin.ts`); bad image file C25 |
| Instrumentation, pass-throughs | `lib/evaluation/result-date.ts`, `lib/evaluation/pending-photo.ts`, `components/connection-chip.tsx`, `components/tab-bar.tsx`, `app/globals.css` tokens, `PhotoReview` back button (`components/guided-camera.tsx:445-452`, a callback that decides nothing) | covered by the consumer | yes - C36 `:355`, C13, C3 / C4, C8 / C19, colours C31-C33 and C56, back button C41 |

## Faults injected

Verified at `e4d8194`; partial. Method:

- **Isolation.** A `git worktree add --detach` at `e4d8194` outside the repo, with `node_modules` as a junction to the real one. Mutations were applied there by a script (`mutate.py` in the session scratchpad). The real tree's baseline porcelain was recorded first: `?? .agents/`, `?? .claude/`, `?? "PRD v1.1.md"`.
- **Unit faults.** Vitest was invoked directly (`node node_modules/vitest/vitest.mjs`). A first `sed` attempt at fault 1 left the file unchanged (empty diff), so that run is not counted.
- **E2E faults.** For fault 3, the worktree alone got `turbopack.root` / `outputFileTracingRoot` set as scaffolding, and `next build` succeeded. The served bundle carried the mutant (`INCONCLUSIVE:{...,fill:"bg-ready"}` in `.next/static/chunks`).
- **Why the E2E faults did not run.** `next start -p 3100` (port checked free first) failed in the instrumentation hook: the migration hit `ECONNREFUSED` on Postgres. `docker events` shows the `agro_vision` stack being stopped at 2026-10-25 02:52:11 in compose order: `kill` and `stop` on app, then on db and minio. This agent issued no Docker command. The stack was still stopped at 04:22. I did not restart it, because that would reverse someone else's deliberate stop. Every E2E test needs Postgres too (`resetDb` in `beforeEach`), so faults 4 and 5 could not run either.

| Mutation | Location | Killed |
| --- | --- | --- |
| `safeOrigin` regex `/^\/(?![/\\])/` → `/^\//` (accepts `//host` and `/\host`) | `lib/evaluation/origin.ts:4` | yes - C49 `tests/unit/origin.test.ts:13`: "expected '//evil.com' to be '/'" and "expected '/\evil.com' to be '/'" (2 of 6 cases failed) |
| a failed load stays cached: `loading.catch(() => { loading = null; })` → `loading.catch(() => {})` | `lib/evaluation/classifier.ts:35-37` | yes - C51 `tests/unit/classifier.test.ts:45`: "promise rejected 'Error: falha simulada' instead of resolving" |
| INCONCLUSIVE bar fill `bg-warn` → `bg-ready` (the round-1 survivor) | `app/analisar/result-view.tsx:11` | not run - built, but the server could not start without Postgres; the target proof is C56 `avaliacao.spec.ts:572` |
| Modelo / Data guard `{!inconclusive && (` → `{(` | `app/analisar/result-view.tsx:98` | not run - same environment stop; the target proof is C40 `avaliacao.spec.ts:377` |
| offline one-row branch disabled (`model && !online` → `model && !online && false`) | `app/(tabs)/model-status.tsx:32` | not run - same environment stop; the target proof is C42 `home.spec.ts:91-96` |

## Gate

Verified at `e4d8194`.

- `pnpm vitest run tests/unit/decision.test.ts tests/unit/classifier.test.ts tests/unit/origin.test.ts --reporter=verbose`: 17 passed, 0 failed.
- `pnpm playwright test tests/e2e/home.spec.ts tests/e2e/avaliacao.spec.ts`: 51 passed, 0 failed (3.8m). This ran before the stack was stopped.
- **Cleanup.** The worktree server was stopped (PID 5480) and the junction deleted first. Then `git worktree remove --force` and a long-path delete of the scratch directory; `git worktree list` shows only the main tree. The real tree's porcelain equals the baseline, and the real `node_modules` is intact (`node_modules/.modules.yaml` still dated 2026-10-04).

## Ranked gaps

1. **1h arrangement uncovered.** No check orders the inconclusive card (block → confidence → bar with mark → "mínimo 85%" → message → tips box → "Tirar outra foto") or its overlap with the 230 px photo. C56 orders the READY card only (`tests/e2e/avaliacao.spec.ts:547-558`). Code: `app/analisar/result-view.tsx:31`, `:76-95`.
2. **1q arrangement uncovered.** No check asserts icon → title → text → action on the state screens, or spinner → title → text on "Carregando modelo...". Code: `app/analisar/evaluation-flow.tsx:271-284`, `:134-138`.
3. **Three checks FAIL on an unasserted position.**
   - C40, "foto no topo" on the inconclusive result: `avaliacao.spec.ts:375` reads `src` only.
   - C43, "no rodapé": `avaliacao.spec.ts:404-412` reads no box.
   - C57, the circle "no topo do cartão": `avaliacao.spec.ts:580` is page-scoped, with no comparison to `home-card`.
4. **Fault injection incomplete.** No mutant has been shown killed on the E2E surfaces the fix created or touched:
   - the round-1 survivor (INCONCLUSIVE fill, `result-view.tsx:11`);
   - the rows guard (`result-view.tsx:98`);
   - the offline one-row branch (`model-status.tsx:32`).

   Re-run these with the `db` / `minio` stack up.
5. **Unproven coverage member, "Carregando modelo..." vocabulary.** It was named in round 1, and the round-2 Coverage row dropped it. Code: `evaluation-flow.tsx:132-139`; no proof.
6. **Design icons with no check on touched screens.**
   - `offline_bolt` on the installed-model line (`app/(tabs)/model-status.tsx:49`) and the one-row line (`:35`).
   - `smartphone` and `cloud_off` on the review notes (`evaluation-flow.tsx:208`, `:213`).
7. **Precision gap, C41.** On the Home-gallery review only the tap behaviour is asserted (`avaliacao.spec.ts:399-401`), and AC 38's "fundo branco" is in no check.
