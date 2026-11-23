# Ajustes do dataset - checks

Profile: ui
Plan: `.specs/features/dataset-ajustes/plan.md`

## Intent

28 checks in 4 slices · 3 one-way doors · 0 open

## Checks

As provas rodam com `pnpm vitest run <file> -t "<name>"`. `integration` usa `gado_certo_test` e o
MinIO; a falha do MinIO é injetada por `deps` (como em `uploadAnimalImage`) e a do banco por um
gatilho, como na F1b. As E2E rodam com `pnpm playwright test <file> -g "<name>"`. Elas usam o
detector falso (`fakeDetector`), as imagens de `galleryImage` e o `uploadPhoto` de `helpers.ts`.
**Os testes rodam só com autorização do usuário.**

### S1 - A galeria do cadastro passa pela revisão · 3 files · 18 KB · ~5k

**C1** - No cadastro, escolher a imagem preta pela galeria (posição Lateral, detector com 1 bovino) abre a revisão com:
- "Esta foto está boa para o dataset?";
- `review-info` com "Lateral";
- "Foto desfocada" e "Foto muito escura";
- "Usar mesmo assim" e "Escolher outra foto".

(AC 1)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "galeria do cadastro abre a revisao"`

**C2** - Tocar "Usar mesmo assim" fecha a revisão. O bloco `field-photo` mostra `photo-preview` e os avisos "Foto desfocada" e "Foto muito escura" (AC 2)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "foto da galeria entra no bloco"`

**C3** - Tocar "Escolher outra foto" fecha a revisão, dispara um novo `filechooser`, e o bloco continua sem `photo-preview` (AC 3)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "escolher outra foto reabre o seletor"`

**C4** - Tocar voltar (`arrow_back`) na revisão da galeria fecha a revisão, e o bloco continua sem `photo-preview` (AC 4)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "voltar descarta a foto da galeria"`

### S2 - Excluir uma foto do perfil · 6 files · 24 KB · ~6k

**C5** - No perfil, tocar a miniatura de uma foto Lateral enviada agora abre o visualizador com:
- a imagem `?variant=full`;
- "Lateral";
- "Hoje, " seguido da hora;
- o botão `data-icon="close"`;
- "Excluir foto".

(AC 5)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "miniatura abre a foto"`

**C6** - "Excluir foto" abre a confirmação com "Excluir esta foto?", "A foto Lateral de Hoje, <hora> será apagada do dataset.", "Cancelar" e "Excluir" com fundo `#B23E2F` (AC 6)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "confirmacao de exclusao"`

**C7** - Com 2 fotos laterais, confirmar "Excluir" volta ao perfil com "1 foto" em Lateral, e `animal_images` fica com 1 linha (AC 7)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "excluir apaga e atualiza o perfil"`

**C8** - "Cancelar" fecha a confirmação; o visualizador continua aberto, e o perfil segue com "2 fotos" (AC 8)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "cancelar mantem a foto"`

**C9** - `DELETE /api/images/{id}` de uma foto existente responde `204`, a linha some de `animal_images`, e `objectKey` e `thumbKey` deixam de existir no bucket (AC 9, door 1)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "DELETE apaga linha e objetos"`

**C10** - `DELETE /api/images/{uuid sem foto}` e `DELETE /api/images/abc` respondem `404` (AC 10)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "DELETE de foto inexistente responde 404"`

**C11** - Com um `store.remove` que falha, `DELETE` responde `204`, a linha some, e `console.error` recebe as duas chaves (AC 11, door 1)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "falha no MinIO depois da linha responde 204"`

**C12** - Com um gatilho que faz o `DELETE` em `animal_images` falhar, a rota responde `500`, a linha continua, e os dois objetos continuam no bucket (AC 12, door 1)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "falha no banco nao remove objetos"`

**C13** - Com o `DELETE` respondendo `500` (rota interceptada), a confirmação mostra "Não foi possível excluir a foto. Tente de novo." e, fechada, o perfil segue com a foto (AC 13)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "erro ao excluir mantem a foto"`

**C14** - Offline, a confirmação mostra "Sem internet — conecte-se para excluir." e "Excluir" fica desabilitado (AC 14)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "offline desabilita excluir"`

### S3 - "Novo cadastro" na aba Dataset · 2 files · 8 KB · ~2k

**C15** - Em `/dataset`, "Novo cadastro" tem `data-icon="add"`, 44 px de altura e fundo `#1F6B45`. Ele fica à direita do título "Dataset", e as duas caixas se sobrepõem na vertical (mesma linha) (AC 15)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "novo cadastro na linha do titulo"`

**C16** - Tocar "Novo cadastro" mostra `role="menu"` com os `menuitem` "Animal" e "Categoria", nesta ordem (AC 16)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "menu com animal e categoria"`

**C17** - "Animal" abre `/dataset/novo` com "Novo animal"; "Categoria" abre `/dataset/categorias/nova` com "Nova categoria" (AC 17)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "menu leva aos cadastros"`

**C18** - Com o menu aberto, tocar no título da página fecha o menu, e abrir de novo e apertar Escape também fecha (AC 18)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "menu fecha fora e com escape"`

**C19** - `/dataset` tem os títulos "Dataset", "Resumo" e "Animais", nesta ordem de cima para baixo, e nenhum título "Categorias" nem `category-item` (AC 19)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "dataset sem categorias"`

### S4 - Imagem da categoria · 9 files · 30 KB · ~8k

**C20** - `/dataset/categorias/nova` mostra "Foto (opcional)" e "Adicionar foto"; o seletor aberto tem `accept="image/*"`. Escolhida a foto de referência, aparecem a prévia e "Remover"; "Remover" volta ao estado sem foto (AC 20)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "campo de foto da categoria"`

**C21** - Salvar "Nelore" com a foto de referência abre `/dataset`. O `PUT` da imagem responde `200` com `imageKey` = `categories/{id}.webp`, e um `PUT` com JPEG 4000 × 3000 grava um WebP de no máximo 640 px no lado maior (AC 21, door 2, door 3)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "categoria com imagem"`
Proof: `pnpm vitest run tests/integration/api-category-image.test.ts -t "imagem gravada em webp de ate 640 px"`

**C22** - No formulário "Novo animal", o cartão "Nelore" (com imagem) tem `<img>` com `src` `/api/categories/{id}/image`, e o cartão "Taurino" mostra "foto referência" (AC 22)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "imagem no cartao do formulario"`

**C23** - Com o primeiro `PUT` da imagem respondendo `503`, a tela mostra "A categoria foi salva, mas a imagem não foi enviada. Toque em Salvar categoria para tentar de novo.". Tocar de novo envia o `PUT` (`200`), abre `/dataset`, e existe uma só categoria "Nelore" (AC 23, door 3)
Proof: `pnpm playwright test tests/e2e/ajustes.spec.ts -g "falha da imagem da categoria e reenviada"`

**C24** - `PUT /api/categories/{id}/image` responde:
- `415` para um arquivo de texto;
- `413` acima de 15 MB;
- `422` sem `file`;
- `404` para um uuid sem categoria;
- `503` com o `store.put` falhando.

Nos casos de erro, `image_key` não muda (AC 24)
Proof: `pnpm vitest run tests/integration/api-category-image.test.ts -t "erros do envio da imagem"`

**C25** - `GET /api/categories/{id}/image` responde `200` com `content-type` `image/webp` depois do `PUT`, e `404` para uma categoria sem imagem e para um uuid sem categoria (AC 25)
Proof: `pnpm vitest run tests/integration/api-category-image.test.ts -t "leitura da imagem da categoria"`

### Do Landing e do Supersedes

**C26** - `drizzle/0004_*.sql` tem só `ALTER TABLE "categories" ADD COLUMN "image_key" text`, sem `NOT NULL` (door 2)
Proof: `pnpm vitest run tests/integration/migrations.test.ts -t "migracao 0004 so adiciona coluna anulavel"`

**C27** - Os testes da F1b revistos pelo Supersedes passam:
- C1 por "Novo cadastro" › "Animal";
- C16 por "Novo cadastro" › "Categoria";
- C17 voltando para `/dataset`;
- C23 checando só o banco;
- C29 com a ordem nova.

C33 sai junto com a seção (Supersedes)
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "cadastrar animal abre o formulario|nova categoria abre o formulario|salvar categoria volta para o dataset|fechar nova categoria nao cria|cabecalho e ordem das secoes"`

**C28** - Os testes que escolhem foto pela galeria do cadastro passam com a revisão no caminho: `fillForm` toca "Usar foto" ou "Usar mesmo assim"; `qualidade.spec.ts` "galeria mede..." e "cadastro avisa sem bloquear"; `cadastro.spec.ts` inteiro (Supersedes)
Proof: `pnpm playwright test tests/e2e/qualidade.spec.ts -g "galeria mede a foto com o detector de imagem|cadastro avisa sem bloquear"`
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts`

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| `DELETE /api/images/{id}` statuses (3) | `204` C9 · C11 · `404` C10 · `500` C12 | - |
| `PUT /api/categories/{id}/image` statuses (6) | `200` C21 · `404` C24 · `413` C24 · `415` C24 · `422` C24 · `503` C24 | - |
| `GET /api/categories/{id}/image` statuses (2) | `200` C25 · `404` C25 | - |
| gallery review actions (3) | "Usar mesmo assim" C2 · "Escolher outra foto" C3 · voltar C4 | - |
| delete flow states (5) | visualizador C5 · confirmação C6 · excluído C7 · cancelado C8 · erro C13 · offline C14 | - |
| delete order (2 failure points) | MinIO depois da linha C11 · banco antes dos objetos C12 | - |
| menu items (2) | "Animal" C16 · C17 · "Categoria" C16 · C17 | - |
| menu dismiss (2) | toque fora C18 · Escape C18 | - |
| `/dataset` sections (3) | cabeçalho C15 · C19 · Resumo C19 · Animais C19 | - |
| category card image (2) | com imagem C22 · sem imagem C22 | - |
| category image field states (2) | sem foto C20 · com foto C20 | - |
| Landing doors (3) | 1 C9 · C11 · C12 · 2 C21 · C26 · 3 C21 · C23 | - |
| entities (2) | `AnimalImage` excluída C9 · `Category.imageKey` C21 · C26 | - |
| superseded tests (2 groups) | F1b C27 · F1c e cadastro C28 | - |

- Claims naming a status code or route: C9-C12, C21, C24, C25. Each has a proof on the real route handler with the real database and MinIO
- No other check claims more than the single case its proof exercises

## Test policy

Mesmas linhas das features anteriores.

| Code | Required proofs | Coverage expectation |
| --- | --- | --- |
| Decides, reached across a boundary | one at the boundary **and** one at its own layer | the contract at the boundary; one asserted case per row of the decision table at its own layer |
| Decides, not reached across a boundary | one at its own layer | one asserted case per row of the decision table |
| Entry point that decides nothing | one at the boundary | accepted input, each rejected input, each error path |
| Instrumentation, pass-throughs | none of its own | covered by its consumer's proof |

Evidence (planned shape):
- `deleteAnimalImage` (existe?, ordem linha → objetos, falha de cada lado): decides, reached by `DELETE` -> C9-C12 at the route handler with real database/MinIO (own layer = boundary, like `uploadAnimalImage`); C7, C13 at the screen
- `uploadCategoryImage` (existe?, arquivo, tamanho, imagem, armazenamento): decides, reached by `PUT` -> C21, C24 at the route handler; C21, C23 at the screen
- gallery review in `PhotoField` (usar, escolher outra, voltar): decides, browser only -> C1-C4 (no component layer; same reading as F4b/F1c)
- "Novo cadastro" menu (abre, fecha fora, Escape): decides, browser only -> C16-C18
- `GET /api/categories/{id}/image`: entry point that decides nothing beyond not-found -> C25

## Swept

- validation: C24 (arquivo, tamanho, ausente), C10 (id)
- failure modes: C11, C12, C13, C23
- idempotency: C23 (reenvio da imagem para a mesma categoria, sem duplicar); `DELETE` repetido responde `404` (C10)
- authorization: n/a - o MVP não tem contas
- concurrency: n/a - exclusão e envio de imagem partem de um só usuário na tela; um `DELETE` duplo cai no `404` do segundo (C10)
- data lifecycle: C9 (exclusão definitiva), C26 (coluna anulável, sem backfill)
- dependency failure: C11, C24 (`503`), C14 (offline)
- state transitions: C1-C4 (revisão da galeria), C5-C8 (visualizador → confirmação → excluído/cancelado), C16-C18 (menu)
- observability: C11 - a falha de remoção no MinIO fica em `console.error` com as chaves, para limpar o bucket depois

## Handoff

Arquivos tocados (`wc -c`, existentes):
- `photo-field.tsx` 9 KB;
- `app/animais/[id]/page.tsx` 6 KB;
- `app/(tabs)/dataset/page.tsx` 5 KB;
- `category-form.tsx` 5 KB;
- `app/api/images/[id]/route.ts` 1 KB;
- schema, repos, `animal-form.tsx` e `page.tsx` (~25 KB);
- testes `dataset.spec.ts`, `qualidade.spec.ts`, `helpers.ts`, `api-images.test.ts` e `migrations.test.ts` (~45 KB).

Novos: grade e visualizador de fotos, menu, rotas da imagem da categoria, `ajustes.spec.ts` e `api-category-image.test.ts` (~35 KB).

Total ≈ 131 KB ÷ 4 ≈ 33k.

- S1-S4 = 33k, under the 150k budget - one builder
