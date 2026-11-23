# Verificação de qualidade da foto - checks

Profile: ui
Plan: `.specs/features/qualidade-imagem/plan.md`

## Intent

24 checks in 3 slices · 3 one-way doors · 1 open, of which 0 block (calibração dos limites com fotos reais)

## Checks

As provas rodam com `pnpm vitest run <file> -t "<name>"`. `unit` roda sem serviços;
`integration` usa `gado_certo_test` e o MinIO. As E2E rodam com `pnpm playwright test <file> -g
"<name>"`, no Chromium com a câmera falsa (`cow-side.y4m`) e o gancho `__gadoDetector`. Este
gancho passa a ter `detectImage` e um carregamento que o teste pode segurar. As imagens de
galeria dos testes são geradas com `sharp`:
- preta 800 × 600;
- branca 800 × 600;
- a foto de referência borrada (`blur(6)`).

**Os testes rodam só com autorização do usuário.**

### S1 - Medir cada foto · 6 files · 30 KB · ~8k

**C1** - Na câmera do perfil, com o detector falso vendo uma `cow` enquadrada (score 0.8), a revisão não lista problema. Com o detector sem nenhuma detecção, a revisão lista "Nenhum bovino encontrado" (AC 1)
Proof: `pnpm playwright test tests/e2e/qualidade.spec.ts -g "camera mede a foto e conta bovinos"`

**C2** - Escolher pela galeria a imagem preta 800 × 600 lista "Foto muito escura" e "Foto desfocada". Vale no cadastro (bloco "Foto do animal") e na avaliação (revisão). Com o `detectImage` falso sem detecção, lista também "Nenhum bovino encontrado" (AC 2, door 3)
Proof: `pnpm playwright test tests/e2e/qualidade.spec.ts -g "galeria mede a foto com o detector de imagem"`

**C3** - `measureQuality` dá brilho 0 numa imagem preta, 255 numa branca, 128 numa cinza (128, 128, 128) e 76,2 (± 0,1) numa vermelha (255, 0, 0) (AC 3, door 2)
Proof: `pnpm vitest run tests/unit/quality.test.ts -t "brilho pela luma"`

**C4** - `measureQuality` dá nitidez 0 numa imagem lisa e mais de 1000 num xadrez preto e branco de 1 px, ambas de 64 × 64 (AC 4, door 2)
Proof: `pnpm vitest run tests/unit/quality.test.ts -t "nitidez pelo laplaciano"`

**C5** - A redução usa k = ⌈maior lado / 512⌉:
- 1024 × 768 vira 512 × 384;
- 1920 × 1440 vira 480 × 360;
- 300 × 200 fica como está.

Um gradiente em 1024 × 768 e o mesmo gradiente em 512 × 384 dão brilhos com diferença ≤ 1 (AC 5, door 2)
Proof: `pnpm vitest run tests/unit/quality.test.ts -t "reducao por blocos"`

**C6** - `countAnimals` conta 2 em `[cow 0.8, cow 0.5, cow 0.4, horse 0.9]` e 0 em `[]` (AC 6)
Proof: `pnpm vitest run tests/unit/quality.test.ts -t "conta so bovino com score"`

**C7** - Com o detector em estado "failed", a revisão da câmera não lista "Nenhum bovino encontrado" nem "Mais de um animal na foto", e o botão diz "Usar foto" (AC 7)
Proof: `pnpm playwright test tests/e2e/qualidade.spec.ts -g "detector indisponivel nao aponta animal"`

### S2 - Avisar na revisão e deixar seguir · 7 files · 45 KB · ~11k

**C8** - `qualityIssues` devolve, nesta ordem, os problemas de cada linha da tabela:
| Entrada | Problemas |
| --- | --- |
| 0 bovinos | `NO_ANIMAL` |
| 1 bovino | nenhum |
| 2 bovinos | `MULTIPLE_ANIMALS` |
| `null` bovinos | nenhum de animal |
| nitidez 49,9 | `BLURRY` |
| nitidez 50 | nenhum |
| brilho 59,9 | `TOO_DARK` |
| brilho 60 | nenhum |
| brilho 220 | nenhum |
| brilho 220,1 | `TOO_BRIGHT` |
| 0 bovinos, nitidez 10, brilho 20 | `NO_ANIMAL`, `BLURRY`, `TOO_DARK` |
(AC 8)
Proof: `pnpm vitest run tests/unit/quality.test.ts -t "problemas pelos limites"`

**C9** - Com a imagem preta pela galeria da avaliação e o detector sem detecção, a revisão lista, nesta ordem, "Nenhum bovino encontrado", "Foto desfocada" e "Foto muito escura". Cada item tem `data-icon="warning"` com cor `#9A6508`, e a lista tem fundo `#FBF4E6`. A imagem branca lista "Foto muito clara" (AC 9)
Proof: `pnpm playwright test tests/e2e/qualidade.spec.ts -g "lista de problemas na revisao"`

**C10** - Com a foto de referência pela galeria da avaliação e um bovino detectado, a revisão não tem `data-testid="quality-issues"` (AC 10)
Proof: `pnpm playwright test tests/e2e/qualidade.spec.ts -g "foto boa sem lista"`

**C11** - Na câmera do perfil:
- sem bovino, o botão principal é "Usar mesmo assim", fica habilitado e, ao ser tocado, envia a foto (`201`);
- com um bovino enquadrado, o botão é "Usar foto".

(AC 11)
Proof: `pnpm playwright test tests/e2e/qualidade.spec.ts -g "dataset usar mesmo assim"`

**C12** - Na avaliação, a imagem preta pela galeria mostra "Analisar mesmo assim", habilitado, que leva a "Modelo de IA ainda não disponível". A foto de referência com um bovino mostra "Analisar imagem" (AC 12)
Proof: `pnpm playwright test tests/e2e/qualidade.spec.ts -g "avaliacao analisar mesmo assim"`

**C13** - Com o carregamento do detector de imagem retido, a revisão da galeria da avaliação mostra "Verificando a foto..." com o botão principal habilitado. Liberado, o texto some e a lista de problemas aparece (AC 13)
Proof: `pnpm playwright test tests/e2e/qualidade.spec.ts -g "verificando a foto"`

**C14** - No cadastro, a imagem preta pela galeria lista "Foto muito escura" e "Foto desfocada" no bloco `field-photo`, abaixo da prévia. Com os outros 6 campos preenchidos, "Salvar animal" fica habilitado e salva (`201`) (AC 14)
Proof: `pnpm playwright test tests/e2e/qualidade.spec.ts -g "cadastro avisa sem bloquear"`

### S3 - Gravar as métricas com a foto do dataset · 6 files · 25 KB · ~6k

**C15** - Um upload com `brightness=181.6`, `sharpness=2261.1` e `animalCount=1` grava `brightness` 181.6, `sharpness` 2261.1 e `animal_count` 1 na linha, e a resposta `201` traz os três. A foto enviada pela câmera do perfil leva os três campos no corpo do `POST` (AC 15, door 1)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "grava as metricas de qualidade"`
Proof: `pnpm playwright test tests/e2e/qualidade.spec.ts -g "camera envia as metricas"`

**C16** - Com o detector "failed", a foto da câmera do perfil é enviada sem `animalCount`, e um upload sem `animalCount` grava `animal_count` `null` (AC 16)
Proof: `pnpm playwright test tests/e2e/qualidade.spec.ts -g "detector indisponivel nao aponta animal"`
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "foto sem metricas grava nulo"`

**C17** - Respondem `422` com o campo em `fields`, sem objeto no bucket nem linha:
- `brightness=-1`;
- `brightness=255.1`;
- `sharpness=-0.1`;
- `animalCount=1.5`;
- `animalCount=51`.

Com `brightness=0`, `brightness=255` e `animalCount=50`, o upload passa (AC 17)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "metricas fora dos limites respondem 422"`

**C18** - Um upload sem nenhuma das três métricas responde `201` e grava as três colunas `null` (AC 18)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "foto sem metricas grava nulo"`

**C19** - Num banco com as migrações até `0002` e uma foto gravada, aplicar a `0003` funciona, e a foto fica com `brightness`, `sharpness` e `animal_count` `null` (AC 19, door 1)
Proof: `pnpm vitest run tests/integration/migrations.test.ts -t "migracao 0003 deixa fotos antigas sem medida"`

### Do Supersedes

**C20** - Em `camera.spec.ts` "disparo em todos os estados envia o estado do instante", o enquadramento enviado por foto continua `FRAMED`, `OUT_OF_FRAME`, `TOO_FAR`, `NOT_DETECTED`, `UNAVAILABLE`. A foto `NOT_DETECTED` passa a ser enviada por "Usar mesmo assim" (Supersedes, AC 11)
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "disparo em todos os estados envia o estado do instante"`

**C21** - Com o `fakeDetector` de `helpers.ts` (um bovino enquadrado), os testes da F4b que tocam "Analisar imagem" continuam passando sem mudar nenhuma asserção (Supersedes, AC 12)
Proof: `pnpm playwright test tests/e2e/avaliacao.spec.ts`

**C22** - `drizzle/0003_*.sql` só tem `ALTER TABLE "animal_images" ADD COLUMN`, e nenhuma coluna nova tem `NOT NULL` (door 1)
Proof: `pnpm vitest run tests/integration/migrations.test.ts -t "migracao 0003 so adiciona colunas anulaveis"`

**C23** - Os testes de upload da F1 em `api-images.test.ts` continuam passando sem mudar asserção: mesmo `imageId` `200`, animal inexistente `404`, arquivo grande `413`, não imagem `415`, falha no banco `500` e armazenamento fora `503` (Surface)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "mesmo imageId|animal inexistente|arquivo grande|nao imagem|falha no banco|armazenamento fora"`

**C24** - Com o quadro da câmera falsa vindo de `cow-side.y4m` e um bovino enquadrado no detector falso, continuam passando sem mudar asserção:
- os testes da F1 "usar foto envia e conta" e "offline desabilita usar foto";
- o teste "foto da camera volta para o formulario" do cadastro, que usa o detector real.

(Supersedes, adicionado no build)
Proof: `pnpm playwright test tests/e2e/camera.spec.ts tests/e2e/cadastro.spec.ts -g "usar foto envia e conta|offline desabilita usar foto|foto da camera volta para o formulario"`

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| `QualityIssue` values (5) | `NO_ANIMAL` C8 · C9 · `MULTIPLE_ANIMALS` C8 · `BLURRY` C8 · C9 · `TOO_DARK` C8 · C9 · `TOO_BRIGHT` C8 · C9 | - |
| threshold edges (6) | nitidez 49,9 C8 · nitidez 50 C8 · brilho 59,9 C8 · brilho 60 C8 · brilho 220 C8 · brilho 220,1 C8 | - |
| animal count rows (4) | 0 C8 · 1 C8 · 2 C8 · `null` C8 · C7 | - |
| detection filter (3) | `cow` ≥ 0.5 C6 · `cow` < 0.5 C6 · outra classe C6 | - |
| reduction sizes (3) | 1024 × 768 C5 · 1920 × 1440 C5 · menor que 512 C5 | - |
| photo sources (4) | câmera do perfil C1 · C11 · câmera da avaliação C21 · galeria do cadastro C2 · C14 · galeria da avaliação C2 · C9 · C12 · C13 | - |
| review action labels (4) | "Usar foto" C11 · "Usar mesmo assim" C11 · "Analisar imagem" C12 · "Analisar mesmo assim" C12 | - |
| review states (3) | com problemas C9 · sem problemas C10 · verificando C13 | - |
| `POST /api/animals/{id}/images` statuses (8) | `201` C15 · C18 · `422` C17 · `200` C23 · `404` C23 · `413` C23 · `415` C23 · `500` C23 · `503` C23 | - |
| metric bounds (8 edges) | `brightness` -1 C17 · 0 C17 · 255 C17 · 255.1 C17 · `sharpness` -0.1 C17 · `animalCount` 1.5 C17 · 50 C17 · 51 C17 | - |
| Landing doors (3) | 1 C15 · C19 · C22 · 2 C3 · C4 · C5 · 3 C2 · C13 | - |
| entities (1) | `AnimalImage` C15 · C19 | - |
| startup config: `__gadoDetector` com `detectImage` (2 assemblies) | ausente no app real, detector MediaPipe em modo imagem C2 (só no navegador real, ver Swept) · presente nos testes C2 · C13 | - |

- `measureQuality`, `countAnimals` e `qualityIssues` são provados na própria camada (C3-C6, C8) e nas telas (C1, C2, C9-C14), então um ramo errado falha nos dois níveis
- A validação do upload é provada na route handler com banco real (C17, C18), que é a própria camada dela

## Test policy

Mesmas linhas das features anteriores.

| Code | Required proofs | Coverage expectation |
| --- | --- | --- |
| Decides, reached across a boundary | one at the boundary **and** one at its own layer | the contract at the boundary; one asserted case per row of the decision table at its own layer |
| Decides, not reached across a boundary | one at its own layer | one asserted case per row of the decision table |
| Entry point that decides nothing | one at the boundary | accepted input, each rejected input, each error path |
| Instrumentation, pass-throughs | none of its own | covered by its consumer's proof |

Evidence (planned shape):
- `measureQuality` (redução por blocos, luma, Laplaciano): decides, reached by every review -> C3, C4, C5 (own layer) and C1, C2 (screens)
- `countAnimals` (classe e score): decides -> C6 and C1, C7
- `qualityIssues` (5 problemas, 6 limites, ordem): decides -> C8 and C9-C12
- upload fields (3 optional bounds): decides, reached by `POST` -> C17, C18 at the route handler with the real database
- `loadImageDetector` (gancho, cache, falha): decides, only in the browser -> C2, C13 (boundary; the repo has no browser unit layer, same reading as F4b)
- `sendPhoto` adding the three fields: pass-through -> C15

## Swept

- validation: C17, C18
- failure modes: C7, C16
- idempotency: existing - o reenvio do mesmo `imageId` devolve a foto gravada (F1); as métricas não mudam esse caminho
- authorization: n/a - o MVP não tem contas
- concurrency: n/a - a medição roda no aparelho sobre uma foto já capturada; nada é disputado
- data lifecycle: C19, C22 - fotos antigas ficam com `null`, sem backfill
- dependency failure: C7, C13 - detector indisponível ou lento. O detector MediaPipe real em modo imagem não tem prova automática; os testes usam o gancho, como na F1. Fica no teste manual do `pnpm dev`
- state transitions: C13 - verificando → com ou sem problemas
- observability: n/a - nenhum log ou métrica de operação; as métricas gravadas são dado do dataset, não telemetria

## Handoff

Arquivos tocados (`wc -c`, existentes) mais uma estimativa dos novos:
- `guided-camera.tsx` 16 KB, `evaluation-flow.tsx` 12 KB, `photo-field.tsx` 8 KB, `detector.ts`, `framing.ts`, `send-photo.ts`, `upload.ts` e `schema.ts` (~11 KB);
- testes existentes: `camera.spec.ts`, `helpers.ts`, `api-images.test.ts`, `migrations.test.ts` (~30 KB);
- novos: `modules/vision/quality/*`, `qualidade.spec.ts`, `quality.test.ts` e a migração (~25 KB).

Total ≈ 102 KB ÷ 4 ≈ 26k.

- S1-S3 = 26k, under the 150k budget - one builder

- **Boundary:** código e testes escritos (feature base `6afd910`). `pnpm typecheck` e `pnpm lint` limpos, incluindo as fronteiras de módulo. A `0003` gerada pelo drizzle-kit só tem três `ADD COLUMN` anuláveis. **Nenhuma prova rodada**: o usuário não autorizou testes nesta feature, e por isso o Verifier também não foi despachado
- **Settled mid-build:**
  - a câmera falsa do Playwright passou a usar `cow-side.y4m`;
  - os dois testes da F1 que fotografavam sem bovino ganharam um bovino no setup (Supersedes do plano, C24).
- **Abandoned:**
  - reduzir a foto com `drawImage` do canvas: trocado pela média de blocos em JavaScript, para a métrica não depender do navegador (door 2, ajustada antes da aprovação)
