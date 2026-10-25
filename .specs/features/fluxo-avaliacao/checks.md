# Fluxo de avaliação a partir da Home - checks

Profile: ui
Plan: `.specs/features/fluxo-avaliacao/plan.md`

## Intent

39 checks in 3 slices · 3 one-way doors · 2 open, of which 0 block (1 blocks go-live)

## Checks

Proofs run with `pnpm vitest run <file> -t "<name>"` (unit, no services) and
`pnpm playwright test <file> -g "<name>"` (E2E in Chromium against `next start`, with the `db` and
`minio` services of `docker compose` and the fake camera of `playwright.config.ts`). A classifier
is present only when a test installs `window.__agroClassifier` with `page.addInitScript`; without
it the app runs exactly as shipped, with no model.

### S1 - Home como tela inicial · 8 files · 22 KB · ~6k

**C1** - Abrir `/` mostra a Home com o cartão "Analisar animal" e a URL continua `/`, sem ir para `/animais` (AC 1, porta 3)
Proof: `pnpm playwright test tests/e2e/home.spec.ts -g "raiz abre a home"`
Done: yes

**C2** - O topo da Home mostra o logo do app com 36 px de largura, "AgroVision" em 18 px peso 700 e o chip de conexão à direita do título (AC 2)
Proof: `pnpm playwright test tests/e2e/home.spec.ts -g "topo da home"`
Done: yes

**C3** - Online, o chip da Home diz "Online", tem fundo `#EAF5EF`, texto `#154C35` e um ponto `#18864B` (AC 3)
Proof: `pnpm playwright test tests/e2e/home.spec.ts -g "chip online"`
Done: yes

**C4** - Offline, o chip da Home diz "Offline", tem o ícone `cloud_off`, fundo `#EEF0EF` e texto `#3C4641` (AC 4)
Proof: `pnpm playwright test tests/e2e/home.spec.ts -g "chip offline"`
Done: yes

**C5** - A Home mostra "Analise um animal usando a câmera ou uma foto." antes do cartão "Analisar animal" (26 px peso 700), "Tire uma foto ou selecione uma imagem", "Tirar foto" com 60 px de altura e fundo `#1F6B45`, e "Escolher da galeria" com 56 px e fundo `#EAF5EF` (AC 5)
Proof: `pnpm playwright test tests/e2e/home.spec.ts -g "cartao analisar animal"`
Done: yes

**C6** - Sem classificador, a Home mostra abaixo do cartão "Modelo de IA ainda não disponível" com o ícone `offline_bolt` em `#68736D`, e não mostra "IA disponível offline" (AC 6)
Proof: `pnpm playwright test tests/e2e/home.spec.ts -g "sem modelo na home"`
Done: yes

**C7** - Com um classificador de versão `1.4.0` pelo gancho, a Home mostra "IA disponível offline" e "Modelo instalado: v1.4.0" (AC 7, porta 1)
Proof: `pnpm playwright test tests/e2e/home.spec.ts -g "modelo instalado na home"`
Done: yes

**C8** - Na Home a aba Home tem `aria-current="page"` e `href="/"`; tocar Home em `/animais` abre `/`; `/inicio` responde `404` (AC 8, porta 3)
Proof: `pnpm playwright test tests/e2e/home.spec.ts -g "aba home"`
Done: yes

### S2 - Capturar e revisar a foto · 7 files · 41 KB · ~10k

**C9** - "Tirar foto" na Home abre `/analisar` com a câmera, a moldura de enquadramento, "Posicione o animal inteiro dentro da área" e as dicas "Fotografe de lado", "Boa iluminação", "Só um animal" e "Corpo inteiro" (AC 9)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "tirar foto abre a camera de avaliacao"`
Done: yes

**C10** - O botão central "Analisar" da barra, em `/animais`, abre `/analisar` com o disparo da câmera (AC 9)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "botao central abre a camera"`
Done: yes

**C11** - A câmera de avaliação mostra "Cancelar" no topo à esquerda, o chip de conexão no topo à direita, e "Galeria", o disparo de 88 px e "Dicas" da esquerda para a direita no terço inferior da tela, sem os elementos `camera-position` e `min-distance` (AC 10)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "layout da camera de avaliacao"`
Done: yes

**C12** - Em `/analisar` a barra inferior não existe na câmera, na revisão, na análise nem no resultado (AC 11, porta 3)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "fluxo sem barra inferior"`
Done: yes

**C13** - "Escolher da galeria" na Home abre um seletor com `accept="image/*"`; escolher `cow-side.jpg` abre `/analisar` na revisão com a foto escolhida (AC 12)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "galeria da home vai para a revisao"`
Done: yes

**C14** - "Galeria" na câmera abre um seletor com `accept="image/*"`; escolher `cow-side.jpg` mostra a revisão (AC 12)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "galeria da camera vai para a revisao"`
Done: yes

**C15** - Com `getUserMedia` rejeitando com `NotAllowedError`, a câmera mostra "Permita o acesso à câmera nas configurações do navegador" e "Tentar novamente", e "Galeria" segue visível e abre o seletor (AC 13)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "permissao negada mantem a galeria"`
Done: yes

**C16** - Depois do disparo, a revisão mostra a foto, "Esta foto está boa para análise?", "Analisar imagem" com 60 px, ícone `center_focus_strong` e fundo `#1F6B45`, "Tirar outra foto" com 56 px e fundo `#EAF5EF`, e "A análise é realizada no seu dispositivo." (AC 14)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "layout da revisao de avaliacao"`
Done: yes

**C17** - Offline, a revisão mostra "Sem internet — a análise continuará normalmente." e "Analisar imagem" continua habilitado (AC 15)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "revisao offline"`
Done: yes

**C18** - "Tirar outra foto" na revisão some com a revisão e volta para a câmera com o disparo habilitado (AC 16)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "tirar outra volta para a camera"`
Done: yes

**C19** - "Cancelar" na câmera aberta pela Home volta para `/`; aberta direto em `/analisar`, "Cancelar" vai para `/` (AC 17)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "cancelar volta para a origem"`
Done: yes

**C20** - Da Home ao resultado, pela câmera e pela galeria, com um classificador pelo gancho, nenhuma requisição vai para um caminho que começa com `/api/` (AC 18)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "nenhuma chamada a api"`
Done: yes

### S3 - Analisar e ver o resultado · 9 files · 32 KB · ~8k

**C21** - Com o `classify` do gancho ainda pendente, "Analisar imagem" mostra "Analisando animal...", "A inteligência artificial está processando a imagem no seu dispositivo.", a miniatura da foto, a linha de varredura, a barra indeterminada, e nenhum texto com `%` (AC 19)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "tela analisando"`
Done: yes

**C22** - Com o carregamento do gancho pendente, "Analisar imagem" mostra "Carregando modelo..." e "Só na primeira abertura."; ao liberar o carregamento, o fluxo segue até o resultado (AC 20)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "carregando modelo"`
Done: yes

**C23** - Sem classificador, "Analisar imagem" mostra "Modelo de IA ainda não disponível", "A avaliação Pronto / Não pronto chega quando o modelo for treinado com as fotos do dataset." e "Voltar ao início", que leva a `/`; a tela não contém "PRONTO", "INCONCLUSIVO" nem `%` (AC 21, porta 1)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "sem modelo nao inventa resultado"`
Done: yes

**C24** - Com o gancho rejeitando com um erro comum, a análise mostra "Erro ao carregar o modelo", "Reinicie o app. Se persistir, reinstale o modelo com internet." e "Tentar novamente"; com o gancho liberado, "Tentar novamente" leva ao resultado (AC 22, porta 1)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "erro ao carregar o modelo"`
Done: yes

**C25** - Um arquivo `quebrada.jpg` do tipo `image/jpeg` com bytes que não são imagem, escolhido pela galeria, faz a análise mostrar "Não foi possível processar esta imagem", "Tente outra foto." e "Tirar outra foto" (AC 23)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "imagem que nao decodifica"`
Done: yes

**C26** - READY 0.85 / NOT_READY 0.15 com limiares 0.85 / 0.85 decide `"READY"` (AC 24, porta 2)
Proof: `pnpm vitest run tests/unit/decision.test.ts -t "pronto no limiar"`
Done: yes

**C27** - READY 0.06 / NOT_READY 0.94 com limiares 0.85 / 0.85 decide `"NOT_READY"` (AC 25, porta 2)
Proof: `pnpm vitest run tests/unit/decision.test.ts -t "nao pronto acima do limiar"`
Done: yes

**C28** - READY 0.62 / NOT_READY 0.38 com limiares 0.85 / 0.85 decide `"INCONCLUSIVE"` (AC 26, porta 2)
Proof: `pnpm vitest run tests/unit/decision.test.ts -t "inconclusivo abaixo dos dois limiares"`
Done: yes

**C29** - READY 0.88 / NOT_READY 0.12 decide `"READY"` com limiar READY 0.85 e `"INCONCLUSIVE"` com limiar READY 0.90 (AC 27)
Proof: `pnpm vitest run tests/unit/decision.test.ts -t "limiar vem do modelo"`
Done: yes

**C30** - A confiança é a maior probabilidade truncada: 0.914 / 0.086 dá 91, 0.151 / 0.849 dá 84 (AC 28)
Proof: `pnpm vitest run tests/unit/decision.test.ts -t "confianca truncada"`
Done: yes

**C31** - Com o gancho devolvendo READY 0.914 / NOT_READY 0.086 e limiares 0.85, o resultado mostra o bloco de fundo `#18864B` com o ícone `check_circle` e "PRONTO PARA ABATE", "91%" seguido de "de confiança", e a barra de confiança em `#18864B` com 91% de largura (AC 29)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "resultado pronto"`
Done: yes

**C32** - Com READY 0.06 / NOT_READY 0.94, o resultado mostra o bloco `#C74A3A` com o ícone `cancel` e "NÃO PRONTO PARA ABATE", "94%" e a barra em `#C74A3A` (AC 30)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "resultado nao pronto"`
Done: yes

**C33** - Com READY 0.62 / NOT_READY 0.38, o resultado mostra o bloco `#E8A93A` com texto `#2E2206`, o ícone `help` e "RESULTADO INCONCLUSIVO", a marca do limiar rotulada "mínimo 85%", a mensagem "A IA não conseguiu determinar o resultado com confiança suficiente. Uma nova foto costuma resolver." e as orientações "Tire outra foto com o animal inteiro visível.", "Evite sombras fortes." e "Fotografe o animal lateralmente." (AC 31)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "resultado inconclusivo"`
Done: yes

**C34** - No resultado inconclusivo, a ação primária é "Tirar outra foto" e tocá-la volta para a câmera com o disparo habilitado (AC 32)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "inconclusivo tira outra foto"`
Done: yes

**C35** - Nos resultados pronto e não pronto, a ação primária é "Nova avaliação" e tocá-la volta para a câmera com o disparo habilitado (AC 33)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "nova avaliacao volta para a camera"`
Done: yes

**C36** - Com o relógio fixo em 2026-10-25 09:42 (America/Sao_Paulo), o resultado mostra a foto analisada no topo, a linha "Modelo" com "CattleClassifier v1.4.0", a linha "Data" com "25 out 2026, 09:42", "Este resultado é uma estimativa gerada pelo modelo de IA." e o botão fechar com o ícone `close`, que leva a `/` (AC 34)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "dados do resultado"`
Done: yes

**C37** - Na Home, na câmera, na revisão, na análise e nos três resultados, o texto da página não contém "autorizado" nem "aprovado" (AC 35)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "vocabulario proibido"`
Done: yes

**C38** - Na Home, na câmera, na revisão e no resultado, todo botão e link visível mede pelo menos 44 × 44 px, e as ações principais têm altura entre 56 e 60 px (AC 36)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts -g "areas de toque do fluxo"`
Done: yes

**C39** - `loadClassifier()` sem gancho rejeita com `ModelUnavailableError`; com o gancho, resolve o classificador que o gancho devolve (porta 1)
Proof: `pnpm vitest run tests/unit/classifier.test.ts -t "carregamento do classificador"`
Done: yes

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| `Decision` values (3) | `READY` C26 · `NOT_READY` C27 · `INCONCLUSIVE` C28 | - |
| decision shown on screen (3) | `READY` C31 · `NOT_READY` C32 · `INCONCLUSIVE` C33 | - |
| threshold source (2) | limiar 0.85 C29 · limiar 0.90 C29 | - |
| confidence truncation (2) | 0.914 C30 · 0.849 C30 | - |
| analysis outcomes (7) | carregando C22 · analisando C21 · sem modelo C23 · erro de carregamento C24 · foto inválida C25 · decisão C31 · nova tentativa após erro C24 | - |
| model status on Home (2) | sem modelo C6 · instalado C7 | - |
| connection state on Home and review (4) | Home online C3 · Home offline C4 · revisão online C16 · revisão offline C17 | - |
| entries into the flow (4) | "Tirar foto" na Home C9 · botão central C10 · "Escolher da galeria" na Home C13 · "Galeria" na câmera C14 | - |
| flow transitions (8) | câmera -> revisão C16 · revisão -> câmera C18 · revisão -> análise C21 · inconclusivo -> câmera C34 · resultado -> câmera C35 · resultado -> `/` C36 · sem modelo -> `/` C23 · câmera -> origem C19 | - |
| screens without the bar (4) | câmera C12 · revisão C12 · análise C12 · resultado C12 | - |
| Landing doors (3) | 1 classificador C39 · C7 · C23 · 2 vocabulário C26 · 3 rotas C1 · C8 · C12 | - |
| entities (0) | none - nothing is persisted | - |
| startup config (1 assembly) | `window.__agroClassifier` absent in the app as shipped C23 · present only in tests C7 | - |

- Claims about what reaches the screen: C31-C33 render the decision; C26-C30 prove the decision table at its own layer, so a wrong branch fails at both levels
- C39 proves `loadClassifier()` at its own layer; C7, C23 and C24 prove the same three branches through the screens
- No route is added (`Surface: None`), so there is no status set

## Test policy

The repo still has no testing guideline; the rows of the F1 (`cadastro-animal/checks.md`) are the
bar this build runs under, unchanged.

| Code | Required proofs | Coverage expectation |
| --- | --- | --- |
| Decides, reached across a boundary | one at the boundary **and** one at its own layer | the contract at the boundary; one asserted case per row of the decision table at its own layer |
| Decides, not reached across a boundary | one at its own layer | one asserted case per row of the decision table |
| Entry point that decides nothing | one at the boundary | accepted input, each rejected input, each error path |
| Instrumentation, pass-throughs | none of its own | covered by its consumer's proof |

Evidence (planned shape):

- política de decisão: 3 decisões, 2 limiares, regra de precedência -> decides, reached by the result screen -> C26-C29 (own layer) and C31-C33 (screen)
- confiança: truncamento e escolha da maior probabilidade -> decides, reached by the result screen -> C30 and C31-C33
- `loadClassifier()`: gancho, sem modelo, erro -> decides, reached by Home and analysis screens -> C39 and C7, C23, C24
- formatação da data: um `Intl.DateTimeFormat` sem condicional -> instrumentation -> covered by C36
- closest analogue in the repo: `lib/camera/framing.ts` (decision table proven in `tests/unit/framing.test.ts` and at the camera screen), same shape

Cost: 6 proofs at their own layer across 2 files. Without these rows the decision table would be
proven only through the result screens, one path at a time.

## Swept

- validation: C25, C13
- failure modes: C24, C25
- idempotency: n/a - nothing is persisted or sent; repeating an analysis has no side effect
- authorization: n/a - no accounts in the MVP; the F1 open question 1 still restricts use to private networks
- concurrency: n/a - "Analisar imagem" leaves the review in the same render (C21), so no second tap reaches a second classification; the flow state lives in one tab
- data lifecycle: n/a - the photo exists only in memory and is dropped when the flow ends; nothing is written
- dependency failure: C15, C23, C24
- state transitions: C18, C19, C23, C34, C35, C36
- observability: n/a - no logging or metric requirement; the timing measure of the F5 arrives with the real model

## Handoff

Sizes from `wc -c` on the files each slice touches (existing) plus an estimate of the new ones:
S1 22 KB + S2 41 KB (`guided-camera.tsx` alone is 16 KB) + S3 32 KB = 95 KB ÷ 4 ≈ 24k.

- S1-S3 = 24k, under the 150k budget - one builder

- **Boundary:** C1-C39 closed at the commit that adds this line (feature base `b49d14f`); unit 47 passed, E2E full suite 93 passed + the 6 fixed tests re-run green in `avaliacao`, `cadastro` and `lista` (53 passed)
- **Settled mid-build:** o usuário autorizou rodar as provas e o Verifier (a regra de não rodar testes por conta própria segue valendo fora disso); "Cancelar" volta para o caminho em `?de=`, que a Home e o botão central preenchem, e só aceita caminhos internos; o `PhotoReview` saiu de `GuidedCamera` para a revisão da galeria usar a mesma folha
- **Abandoned:** `toHaveAttribute("data-primary-action", "")` - o React grava `"true"`, então a prova passou a afirmar a presença do atributo; liberar a classificação ao ver "Analisando" - a tela aparece antes de `classify` ser chamado, então o teste espera o liberador existir (`releaseClassify`); ler o corpo do upload no teste do cadastro da F1 - o Playwright devolve `null` para upload de arquivo escolhido, e a prova passou a ler `animal_images`
