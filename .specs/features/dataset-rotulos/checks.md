# Rótulos Pronto / Não pronto, categorias cadastráveis e aba Dataset - checks

Profile: ui
Plan: `.specs/features/dataset-rotulos/plan.md`

## Intent

58 checks in 5 slices · 5 one-way doors · 0 open. C54 a C58 vêm do Landing, do sweep e da
cobertura: a trava da migração, a corrida no nome, os três status do `POST /api/animals`, a
correção que falha no meio e o offline do formulário na rota nova.

## Checks

As provas rodam com `pnpm vitest run <file> -t "<name>"`. `unit` roda sem serviços;
`integration` usa o banco `gado_certo_test` e o MinIO do `docker compose`. As de interface rodam
com `pnpm playwright test <file> -g "<name>"`, no Chromium contra `next start`, com os mesmos
serviços. `resetDb` passa a apagar `animal_images`, `animals` e as categorias que não são seed.
Taurino e Zebu continuam entre os testes.

### S1 - Cadastrar o animal com categoria e rótulo · 15 files · 62 KB · ~16k

**C1** - Em `/dataset`, tocar "Cadastrar animal" abre `/dataset/novo` com o título "Novo animal" (AC 1)
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "cadastrar animal abre o formulario"`
Done: yes

**C2** - `/dataset/novo` mostra os blocos `field-photo`, `field-externalId`, `field-category`, `field-readiness`, `field-age`, `field-weight`, `field-sex` e `card-preview`, nessa ordem de cima para baixo (AC 2)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "ordem dos campos e cabecalho do formulario"`
Done: yes

**C3** - Com Taurino, Zebu e "Nelore" (sem descrição) cadastradas, Categoria mostra três cartões nessa ordem: Taurino e Zebu na mesma linha, Zebu à direita, e Nelore na linha de baixo. Taurino tem a legenda "Sem cupim", Zebu tem "Com cupim" e Nelore não tem legenda. O cartão tocado ganha borda `#1F6B45` e `category-check`, e os outros não (AC 3)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "cartoes de categoria"`
Done: yes

**C4** - Rótulo mostra "Pronto" / "Pronto para abate" e "Não pronto" / "Ainda não está pronto". "Pronto" tocado tem `border-color` `#18864B` e fundo `#E3F3EA`; "Não pronto" tocado tem borda `#C74A3A` e fundo `#FAEBE8`. O cartão não escolhido tem fundo `#FFFFFF` (AC 4)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "cartoes de rotulo"`
Done: yes

**C5** - Com 0 a 6 campos preenchidos, o rodapé mostra "<n> de 7 preenchidos" com o n certo e "Salvar animal" fica desabilitado. Com os 7, mostra "7 de 7 preenchidos" e o botão fica habilitado (AC 5)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "contador e botao desabilitado com 0 a 6 campos"`
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "sete de sete habilita salvar"`
Done: yes

**C6** - Escolhido "Não pronto", a prévia mostra o selo "NÃO PRONTO" com fundo `#FAEBE8` e texto `#C74A3A`. Trocado para "Pronto", mostra "PRONTO" com fundo `#E3F3EA` e texto `#136B3C` (AC 6)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "previa do card com selo do rotulo"`
Done: yes

**C7** - Salvar "023", Taurino, Não pronto, 24 meses, 485 kg, Macho, com foto Lateral, abre `/animais/{id}`. A linha em `animals` tem `category_id` = `00000000-0000-4000-8000-000000000001` e `readiness` = `NOT_READY` (AC 7, door 2)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "salvar cria o animal, envia a foto e abre o perfil"`
Done: yes

**C8** - Em `/dataset/novo`, tocar "Fechar" abre `/dataset` (AC 8)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "fechar volta para o dataset"`
Done: yes

**C9** - `POST /api/animals` com `categoryId` ausente, com `"abc"` ou com um uuid sem categoria responde `422` com `fields.categoryId` = "Escolha a categoria", e `animals` continua vazia (AC 9, door 2)
Proof: `pnpm vitest run tests/integration/api-animals.test.ts -t "categoryId invalido responde 422"`
Done: yes

**C10** - `POST /api/animals` com `readiness` ausente ou `"PRONTO"` responde `422` com `fields.readiness` = "Escolha o rótulo", e `animals` continua vazia (AC 10, door 3)
Proof: `pnpm vitest run tests/integration/api-animals.test.ts -t "readiness invalido responde 422"`
Done: yes

**C11** - Um animal da categoria "Nelore", fêmea, aparece como "Nelore • Fêmea" na linha da aba Animais e no cartão do perfil, com a grade mostrando "Categoria Nelore". No formulário, Nelore e Fêmea escolhidas deixam a prévia em "Nelore • Fêmea" (AC 11)
Proof: `pnpm playwright test tests/e2e/lista.spec.ts -g "item com categoria cadastrada"`
Proof: `pnpm playwright test tests/e2e/perfil.spec.ts -g "cartao do perfil com categoria cadastrada"`
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "previa do card"`
Done: yes

**C12** - Abrir `/animais/novo` mostra "This page could not be found." com `<meta name="robots" content="noindex">` e sem o formulário "Novo animal" (AC 12; revisto em 2026-11-22 por decisão do usuário. Antes pedia status `404`, que o streaming de `app/loading.tsx` não permite)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "animais novo cai no nao encontrado"`
Done: yes

### S2 - Cada foto guarda o rótulo da captura · 4 files · 16 KB · ~4k

**C13** - Uma foto enviada para um animal `NOT_READY` grava `readiness_at_capture` = `NOT_READY`. Depois de `PUT .../readiness` com `READY` e `FROM_NOW`, a foto seguinte grava `READY`, e a primeira continua `NOT_READY` (AC 13, door 3)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "linha com o rotulo da captura"`
Done: yes

**C14** - Para um animal `READY` e um `NOT_READY`, a foto Lateral fica em `animals/{animalId}/SIDE/{imageId}.jpg` e `animals/{animalId}/SIDE/{imageId}_thumb.webp`, sem o rótulo nem a categoria na chave (AC 14, door 4)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "chaves no bucket por animal, posicao e imagem"`
Done: yes

**C15** - Logo depois das migrações, `categories` tem exatamente duas linhas: `00000000-0000-4000-8000-000000000001` "Taurino" "Sem cupim" e `00000000-0000-4000-8000-000000000002` "Zebu" "Com cupim" (AC 15, door 1)
Proof: `pnpm vitest run tests/integration/api-categories.test.ts -t "seed taurino e zebu"`
Done: yes

### S3 - Cadastrar uma categoria · 8 files · 20 KB · ~5k

**C16** - Em `/dataset`, tocar "+ Nova" abre `/dataset/categorias/nova` com: o título "Nova categoria"; o botão com `data-icon="close"`; os campos com rótulo "Nome" e "Descrição (opcional)"; e "Salvar categoria" com 58 px de altura (AC 16)
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "nova categoria abre o formulario"`
Done: yes

**C17** - Salvar "Nelore" com "Cruzado zebuíno" abre `/dataset`, e Categorias mostra "Nelore · Cruzado zebuíno". `POST /api/categories` válido responde `201` com `{ category }` (AC 17)
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "salvar categoria volta para o dataset"`
Proof: `pnpm vitest run tests/integration/api-categories.test.ts -t "POST valido responde 201"`
Done: yes

**C18** - Com "Nelore" criada, `/dataset/novo` mostra o cartão "Nelore", e os filtros das abas Animais e Dataset mostram o chip "Nelore" (AC 18)
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "categoria nova no formulario e nos filtros"`
Done: yes

**C19** - Nome `""`, `"   "` ou com 31 caracteres responde `422` com `fields.name` = "Informe um nome de até 30 caracteres", e nenhuma linha nova aparece. Um nome com 30 caracteres responde `201`. Na tela, salvar com o nome em branco mostra a mensagem no campo e continua em `/dataset/categorias/nova` (AC 19)
Proof: `pnpm vitest run tests/unit/category-validation.test.ts -t "limites do nome"`
Proof: `pnpm vitest run tests/integration/api-categories.test.ts -t "nome fora dos limites responde 422"`
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "nome vazio mostra erro no campo"`
Done: yes

**C20** - Descrição com 41 caracteres responde `422` com `fields.description` = "A descrição tem no máximo 40 caracteres", sem linha nova. Com 40 caracteres responde `201` (AC 20)
Proof: `pnpm vitest run tests/unit/category-validation.test.ts -t "limites da descricao"`
Proof: `pnpm vitest run tests/integration/api-categories.test.ts -t "descricao fora do limite responde 422"`
Done: yes

**C21** - Com "Nelore" cadastrada, `POST` de `"nelore "` e de `"NELORE"` respondem `409` com `fields.name` = "Já existe uma categoria com este nome.", e só existe uma linha Nelore. Na tela, salvar "nelore " mostra a mensagem no campo Nome (AC 21, door 1)
Proof: `pnpm vitest run tests/integration/api-categories.test.ts -t "nome duplicado sem caixa e espacos responde 409"`
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "nome duplicado mostra erro no campo"`
Done: yes

**C22** - Dois `POST /api/categories` com o mesmo `id`: o segundo responde `200` com a categoria do primeiro, e `categories` tem uma linha a mais, não duas (AC 22)
Proof: `pnpm vitest run tests/integration/api-categories.test.ts -t "mesmo id responde 200"`
Done: yes

**C23** - Em `/dataset/categorias/nova`, digitar "Angus" e tocar fechar abre `/dataset`, e "Angus" não está em Categorias nem em `categories` (AC 23)
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "fechar nova categoria nao cria"`
Done: yes

**C24** - Offline, `/dataset/categorias/nova` mostra "Sem internet — conecte-se para salvar." e "Salvar categoria" fica desabilitado (AC 24)
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "offline desabilita salvar categoria"`
Done: yes

### S4 - Aba Dataset e navegação · 12 files · 48 KB · ~12k

**C25** - A barra tem exatamente 5 links, nesta ordem: Home, Histórico, Analisar, Animais e Dataset. Nenhum link se chama "Ajustes" (AC 25)
Proof: `pnpm playwright test tests/e2e/navegacao.spec.ts -g "barra inferior com as cinco abas"`
Done: yes

**C26** - Tocar Dataset na barra abre `/dataset`. A aba Dataset tem `aria-current="page"`, cor `#1F6B45` e um ícone com `data-icon="dataset"` (AC 26)
Proof: `pnpm playwright test tests/e2e/navegacao.spec.ts -g "aba dataset"`
Done: yes

**C27** - Na Home, o link `aria-label="Ajustes"` tem `data-icon="settings"`, mede pelo menos 44 × 44 px e fica à direita do chip de conexão. Tocá-lo abre `/ajustes` (AC 27)
Proof: `pnpm playwright test tests/e2e/home.spec.ts -g "engrenagem leva a ajustes"`
Done: yes

**C28** - `/ajustes` mostra "Configurações" e "Em breve", a barra está visível e nenhum link dela tem `aria-current` (AC 28)
Proof: `pnpm playwright test tests/e2e/navegacao.spec.ts -g "ajustes em breve sem aba ativa"`
Done: yes

**C29** - Com 2 animais e 3 fotos, `/dataset` mostra o título "Dataset" e "2 animais · 3 fotos". Em seguida vêm, de cima para baixo: o botão "Cadastrar animal" (fundo `#1F6B45`, `data-icon="add"`), o título "Resumo", o título "Categorias" e o título "Animais". Com 1 animal e 1 foto, o texto é "1 animal · 1 foto" (AC 29)
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "cabecalho e ordem das secoes"`
Done: yes

**C30** - Com Taurino Não pronto (2 fotos), Zebu Não pronto (1 foto) e Taurino Pronto (1 foto), o Resumo mostra:
- o cartão "NÃO PRONTO", com o título em `#C74A3A`, "3 fotos" e "Taurino 2 · Zebu 1";
- o cartão "PRONTO", com o título em `#18864B`, "1 foto" e "Taurino 1".

(AC 30)
Proof: `pnpm vitest run tests/unit/dataset-summary.test.ts -t "agrupa por rotulo e categoria em ordem de criacao"`
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "resumo por rotulo e categoria"`
Done: yes

**C31** - Animal Não pronto com 2 fotos, mudado para Pronto com "O animal mudou" e com mais 1 foto: o Resumo mostra NÃO PRONTO "2 fotos" e PRONTO "1 foto" (AC 31, door 3)
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "resumo conta o rotulo da captura"`
Done: yes

**C32** - Sem nenhuma foto, o Resumo mostra "Nenhuma foto ainda" e nenhum cartão "PRONTO" nem "NÃO PRONTO" (AC 32)
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "dataset vazio"`
Done: yes

**C33** - Com 1 animal Taurino e "Nelore" sem descrição, Categorias lista, em ordem:
- "Taurino · Sem cupim" com "1 animal";
- "Zebu · Com cupim" com "0 animais";
- "Nelore" com "0 animais".

"+ Nova" fica na linha do título da seção. (AC 33)
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "lista de categorias"`
Done: yes

**C34** - A seção Animais de `/dataset` tem a busca "Buscar brinco ou ID" e os chips Todos, Pronto, Não pronto, Taurino e Zebu, nessa ordem. Com A (Taurino, Pronto) e B (Zebu, Não pronto), cada chip mostra exatamente:
- Todos: A e B;
- Pronto: A;
- Não pronto: B;
- Taurino: A;
- Zebu: B.

(AC 34)
Proof: `pnpm vitest run tests/unit/animal-filters.test.ts -t "filtro por rotulo, categoria e sexo"`
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "filtros da lista do dataset"`
Done: yes

**C35** - Sem animais, a seção Animais de `/dataset` mostra "Nenhum animal cadastrado" (AC 35)
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "dataset vazio"`
Done: yes

**C36** - A linha de um animal Pronto mostra "PRONTO" (fundo `#E3F3EA`, texto `#136B3C`), e a de um Não pronto mostra "NÃO PRONTO" (fundo `#FAEBE8`, texto `#C74A3A`), na aba Animais e na aba Dataset (AC 36)
Proof: `pnpm playwright test tests/e2e/lista.spec.ts -g "selo do rotulo na linha"`
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "selo do rotulo na lista do dataset"`
Done: yes

**C37** - `/animais`, com 1 animal e sem nenhum, não tem nenhum link nem botão com o texto "Adicionar animal" (AC 37)
Proof: `pnpm playwright test tests/e2e/lista.spec.ts -g "aba animais sem adicionar animal"`
Done: yes

**C38** - Sem animais, `/animais` mostra "Nenhum animal cadastrado", "Cadastre animais na aba Dataset." e o link "Ir para Dataset", com pelo menos 44 px de altura. Tocá-lo abre `/dataset` (AC 38)
Proof: `pnpm playwright test tests/e2e/lista.spec.ts -g "estado vazio"`
Done: yes

**C39** - Com "Nelore" cadastrada, os chips de `/animais` são Todos, Taurino, Zebu, Nelore, Machos e Fêmeas, nessa ordem. Com um Taurino macho e uma Nelore fêmea, cada chip mostra exatamente o seu grupo (AC 39)
Proof: `pnpm playwright test tests/e2e/lista.spec.ts -g "chips de filtro"`
Done: yes

### S5 - Mudar o rótulo depois do cadastro · 10 files · 36 KB · ~9k

**C40** - No perfil de um animal Não pronto:
- o selo "NÃO PRONTO" fica na mesma linha do título "Animal #023";
- a linha "Rótulo" fica abaixo da grade e acima de "Fotografar animal";
- "Alterar" tem pelo menos 44 px de altura e `href="/animais/{id}/rotulo?de=/animais/{id}"`.

(AC 40)
Proof: `pnpm playwright test tests/e2e/perfil.spec.ts -g "rotulo no perfil"`
Done: yes

**C41** - `/animais/{id}/fotos` mostra "As fotos serão salvas como", o selo do rótulo atual e "Alterar". O link tem pelo menos 44 px de altura e `href="/animais/{id}/rotulo?de=/animais/{id}/fotos"` (AC 41)
Proof: `pnpm playwright test tests/e2e/rotulo.spec.ts -g "qual posicao mostra o rotulo"`
Done: yes

**C42** - `/animais/{id}/rotulo` de um animal Não pronto mostra:
- o voltar (`data-icon="arrow_back"`, 44 × 44 px);
- "Animal #023";
- o título "Alterar rótulo";
- "Não pronto" com `aria-pressed="true"` e "Pronto" com `aria-pressed="false"`;
- "Salvar rótulo" com 58 px de altura.

(AC 42)
Proof: `pnpm playwright test tests/e2e/rotulo.spec.ts -g "tela alterar rotulo"`
Done: yes

**C43** - Com 2 fotos, a tela mostra "Por que mudar?", "O animal mudou" com "Só as fotos novas recebem o rótulo novo." e "Corrigir erro de cadastro" com "As 2 fotos já tiradas também mudam.". Com 1 foto, a legenda é "A foto já tirada também muda." (AC 43)
Proof: `pnpm playwright test tests/e2e/rotulo.spec.ts -g "motivo com fotos"`
Done: yes

**C44** - Sem fotos, a tela não mostra "Por que mudar?". Escolher "Pronto" habilita "Salvar rótulo", e salvar deixa o animal `READY` com uma requisição de `scope` = `FROM_NOW` (AC 44)
Proof: `pnpm playwright test tests/e2e/rotulo.spec.ts -g "sem fotos nao pergunta o motivo"`
Done: yes

**C45** - Com fotos, "Salvar rótulo" fica desabilitado com o rótulo atual marcado. Continua desabilitado depois de marcar o outro rótulo sem escolher o motivo, e fica habilitado depois do motivo (AC 45)
Proof: `pnpm playwright test tests/e2e/rotulo.spec.ts -g "salvar desabilitado ate escolher"`
Done: yes

**C46** - Salvar Pronto com "O animal mudou", aberto pelo perfil:
- volta para `/animais/{id}`;
- o animal fica `READY`;
- as 2 fotos continuam `NOT_READY`.

No `PUT`, `FROM_NOW` responde `200` com `photosUpdated` = 0 (AC 46, door 3)
Proof: `pnpm playwright test tests/e2e/rotulo.spec.ts -g "o animal mudou mantem as fotos"`
Proof: `pnpm vitest run tests/integration/api-readiness.test.ts -t "FROM_NOW muda so o animal"`
Done: yes

**C47** - Salvar Pronto com "Corrigir erro de cadastro", aberto por "Qual posição?":
- volta para `/animais/{id}/fotos`;
- o animal e as 2 fotos ficam `READY`.

No `PUT`, `FIX_ALL_PHOTOS` responde `200` com `photosUpdated` = 2 (AC 47)
Proof: `pnpm playwright test tests/e2e/rotulo.spec.ts -g "corrigir erro muda as fotos"`
Proof: `pnpm vitest run tests/integration/api-readiness.test.ts -t "FIX_ALL_PHOTOS muda animal e fotos"`
Done: yes

**C48** - Marcar Pronto e tocar voltar leva para o `de` (`/animais/{id}`), e o animal continua `NOT_READY` (AC 48)
Proof: `pnpm playwright test tests/e2e/rotulo.spec.ts -g "voltar nao muda nada"`
Done: yes

**C49** - O destino da tela de rótulo é `/animais/{id}` quando `de` é `//evil.com`, `/\evil.com`, `https://evil.com`, ausente ou repetido, e é o próprio caminho quando `de` é `/animais/{id}/fotos`. Na tela, com `de=//evil.com`, salvar abre `/animais/{id}` (AC 49)
Proof: `pnpm vitest run tests/unit/origin.test.ts -t "destino do rotulo cai no perfil"`
Proof: `pnpm playwright test tests/e2e/rotulo.spec.ts -g "de externo volta para o perfil"`
Done: yes

**C50** - `PUT /api/animals/{uuid sem animal}/readiness` responde `404`. Abrir `/animais/{uuid sem animal}/rotulo` mostra "This page could not be found." com a meta `noindex` e sem "Alterar rótulo" (AC 50; a parte da página foi revista em 2026-11-22, como C12)
Proof: `pnpm vitest run tests/integration/api-readiness.test.ts -t "animal inexistente responde 404"`
Proof: `pnpm playwright test tests/e2e/rotulo.spec.ts -g "rotulo de animal inexistente cai no nao encontrado"`
Done: yes

**C51** - `PUT .../readiness` com `readiness` = `"PRONTO"` responde `422` com `fields.readiness`; com `scope` = `"ALL"` responde `422` com `fields.scope`. Nos dois casos, o animal e as fotos não mudam (AC 51)
Proof: `pnpm vitest run tests/integration/api-readiness.test.ts -t "corpo invalido responde 422"`
Done: yes

**C52** - Offline, `/animais/{id}/rotulo` mostra "Sem internet — conecte-se para salvar." e "Salvar rótulo" fica desabilitado (AC 52)
Proof: `pnpm playwright test tests/e2e/rotulo.spec.ts -g "offline desabilita salvar rotulo"`
Done: yes

**C53** - Medem pelo menos 44 × 44 px todos os botões e links visíveis de `/dataset` (com 1 animal e 1 categoria), de `/dataset/categorias/nova` e de `/animais/{id}/rotulo` (com fotos), além da engrenagem da Home (AC 53)
Proof: `pnpm playwright test tests/e2e/dataset.spec.ts -g "alvos de toque das telas novas"`
Proof: `pnpm playwright test tests/e2e/rotulo.spec.ts -g "alvos de toque do rotulo"`
Done: yes

### Do Landing e do sweep

**C54** - Num banco novo com a `0000_init.sql` aplicada e um animal inserido, aplicar a `0001` falha com erro do Postgres, e `animals` continua com a coluna `category` (door 5)
Proof: `pnpm vitest run tests/integration/migrations.test.ts -t "migracao 0001 falha com animal existente"`
Done: yes

**C55** - Dois `POST /api/categories` simultâneos com "Angus" e ids diferentes: um responde `201`, o outro `409`, e `categories` tem uma linha "Angus" (AC 21, door 1)
Proof: `pnpm vitest run tests/integration/api-categories.test.ts -t "concorrencia no nome: um 201, um 409, uma linha"`
Done: yes

**C56** - `POST /api/animals` com `categoryId` do Zebu e `readiness` = `READY` responde `201`, e a linha grava os dois. O mesmo `id` de novo responde `200` com o animal gravado. A mesma identificação com outro `id` responde `409` (Surface `POST /api/animals`, doors 2 e 3)
Proof: `pnpm vitest run tests/integration/api-animals.test.ts -t "POST valido responde 201"`
Proof: `pnpm vitest run tests/integration/api-animals.test.ts -t "mesmo id responde 200 com o animal gravado"`
Proof: `pnpm vitest run tests/integration/api-animals.test.ts -t "identificacao duplicada responde 409"`
Done: yes

**C57** - Uma correção (`FIX_ALL_PHOTOS`) cuja gravação das fotos falha não muda nada: o animal continua `NOT_READY` e as fotos também (AC 47)
Proof: `pnpm vitest run tests/integration/api-readiness.test.ts -t "correcao que falha nao muda nada"`
Done: yes

**C58** - Offline, em `/dataset/novo` com os 7 campos preenchidos, "Salvar animal" fica desabilitado e aparece "Sem internet — conecte-se para salvar." (comportamento da F1 C18 na rota nova, AC 1)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "offline desabilita salvar"`
Done: yes

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| `POST /api/categories` statuses (4) | `201` C17 · `200` C22 · `409` C21 · `422` C19 · C20 | - |
| `POST /api/animals` statuses (4) | `201` C56 · `200` C56 · `409` C56 · `422` C9 · C10 | - |
| `PUT /api/animals/{id}/readiness` statuses (3) | `200` C46 · C47 · `404` C50 · `422` C51 | - |
| `Readiness` values (2) | `READY` C13 · C56 · `NOT_READY` C7 · C13 | - |
| readiness `scope` (2) | `FROM_NOW` C46 · `FIX_ALL_PHOTOS` C47 | - |
| `categoryId` rejected inputs (3) | ausente C9 · não uuid C9 · uuid sem categoria C9 | - |
| `readiness` rejected inputs (2) | ausente C10 · fora do enum C10 | - |
| name bound (4 edges) | `""` C19 · `"   "` C19 · 30 chars C19 · 31 chars C19 | - |
| description bound (2 edges) | 40 chars C20 · 41 chars C20 | - |
| duplicate name forms (3) | espaço na ponta C21 · caixa diferente C21 · simultâneo C55 | - |
| summary grouping (4) | NÃO PRONTO com 2 categorias C30 · PRONTO com 1 categoria C30 · conta pelo rótulo da captura C31 · sem fotos C32 | - |
| count wording (4) | "1 animal" C29 · C33 · "<n> animais" C29 · C33 · "1 foto" C29 · C30 · "<n> fotos" C29 · C30 | - |
| Dataset list chips (5) | Todos C34 · Pronto C34 · Não pronto C34 · Taurino C34 · Zebu C34 | - |
| Animais tab chips (6) | Todos C39 · Taurino C39 · Zebu C39 · Nelore C39 · Machos C39 · Fêmeas C39 | - |
| reason question by photo count (3) | 0 fotos C44 · 1 foto C43 · 2 fotos C43 | - |
| "Salvar rótulo" guard (3) | rótulo atual C45 · sem motivo C45 · pronto para salvar C45 | - |
| rótulo `de` inputs (6) | `//host` C49 · `/\host` C49 · `https://host` C49 · ausente C49 · repetido C49 · caminho interno C49 | - |
| rótulo screen transitions (4) | salvar com motivo -> `de` C46 · C47 · voltar -> `de` C48 · `de` externo -> perfil C49 · animal inexistente -> não encontrado C50 | - |
| readiness badge places (4) | linha da aba Animais C36 · linha da aba Dataset C36 · perfil C40 · "Qual posição?" C41 | - |
| readiness badge looks (2) | PRONTO C6 · C36 · NÃO PRONTO C6 · C36 | - |
| tab bar items (6) | Home C25 · Histórico C25 · Analisar C25 · Animais C25 · Dataset C25 · C26 · Ajustes ausente C25 | - |
| empty states (3) | Resumo sem fotos C32 · Animais do Dataset sem animais C35 · aba Animais sem animais C38 | - |
| offline states (3) | nova categoria C24 · alterar rótulo C52 · novo animal C58 | - |
| arrangement per screen (7) | `/dataset` C29 · `/dataset/novo` C2 · `/dataset/categorias/nova` C16 · `/animais/{id}/rotulo` C42 · perfil C40 · "Qual posição?" C41 · topo da Home C27 | - |
| icons per screen (5) | barra `dataset` C26 · Home `settings` C27 · Dataset `add` C29 · nova categoria `close` C16 · rótulo `arrow_back` C42 | - |
| touch targets (4 screens) | `/dataset` C53 · `/dataset/categorias/nova` C53 · `/animais/{id}/rotulo` C53 · engrenagem da Home C27 · C53 | - |
| Landing doors (5) | 1 C15 · C21 · C55 · 2 C7 · C9 · 3 C10 · C13 · C46 · 4 C14 · 5 C54 | - |
| entities (3) | `Category` C15 · C17 · `Animal` C7 · C56 · `AnimalImage` C13 | - |
| startup config: migrations with seed (2 assemblies) | app via `instrumentation.ts` contra `gado_certo_test` C3 · globalSetup do Vitest C15 | - |

- Claims naming a status code, route or response shape: C9, C10, C17, C19-C22, C46, C47, C50, C51, C55, C56. Each has a proof that crosses `POST`/`PUT` on the real route handler with the real database
- C30 and C34 prove the grouping and the filter at their own layer (unit) and at the screen, so a wrong branch fails at both levels
- C49 proves the destination at its own layer for the six inputs and at the screen for one
- No other check claims more than the single case its proof exercises

## Test policy

The repo still has no testing guideline. The rows of the F1 (`cadastro-animal/checks.md`) and the
F4b are the bar this build runs under, unchanged.

| Code | Required proofs | Coverage expectation |
| --- | --- | --- |
| Decides, reached across a boundary | one at the boundary **and** one at its own layer | the contract at the boundary; one asserted case per row of the decision table at its own layer |
| Decides, not reached across a boundary | one at its own layer | one asserted case per row of the decision table |
| Entry point that decides nothing | one at the boundary | accepted input, each rejected input, each error path |
| Instrumentation, pass-throughs | none of its own | covered by its consumer's proof |

Evidence (planned shape):
- **Validação da categoria** (nome com trim e limite 1-30, descrição até 40): decides, reached by
  `POST /api/categories`. Own layer C19 e C20 (unit); boundary C19, C20 e C21.
- **Validação do animal** (`categoryId` uuid e existente, `readiness` no enum): decides, reached
  by `POST /api/animals`. Os 5 casos rejeitados na boundary (C9, C10); a existência da categoria
  só se decide no banco, então a boundary com banco real é a própria camada.
- **Resumo do dataset** (agrupar fotos por rótulo de captura × categoria, ordem de criação,
  omitir categoria sem foto): decides, reached by `/dataset`. Own layer C30 (unit); screen C30,
  C31 e C32.
- **Filtros da lista** (casar por `readiness`, `categoryId` ou `sex`; "Todos"): decides, reached
  by as duas abas. Own layer C34 (unit); screen C34 e C39.
- **Mudança de rótulo** (`FROM_NOW` × `FIX_ALL_PHOTOS`, transação): decides, reached by
  `PUT .../readiness`. A route handler com banco real é a própria camada. C46, C47 e C57 na
  integração, C46 e C47 na tela.
- **Destino da tela de rótulo** (`safeOrigin` com o perfil no lugar de `/`): decides, reached by
  voltar e salvar. Own layer C49 (unit, 6 entradas); screen C49.
- **Estado da tela de rótulo** (pergunta só com fotos, guarda do salvar): decides, só na tela.
  O repo não tem camada de teste de componente, então a boundary é a camada (mesma leitura da
  F4b). C43, C44 e C45 cobrem os 3 + 3 membros.
- **Snapshot no upload** (`readinessAtCapture = animal.readiness`, sem condicional): pass-through
  dentro de `uploadAnimalImage`, coberto pelo consumidor C13.
- **Selos e textos de contagem** (`READINESS_LABEL`, plural): mapping de 2 linhas cada. As duas
  linhas são afirmadas na tela (C6, C29, C30, C33, C36).
- **Closest analogue in the repo**: `lib/evaluation/origin.ts` (unit + tela) e
  `lib/animals/validation.ts` (unit + integração), mesmo formato.

Cost: 4 proofs at their own layer in 4 new unit files. Without these rows the summary grouping
and the filters would be proven only through the screens, one path at a time.

## Swept

- validation: C9, C10, C19, C20, C51
- failure modes: C57, C54
- idempotency: C22, C56
- authorization: n/a - o MVP não tem contas; a pergunta aberta 1 da F1 segue restringindo o uso a redes privadas
- concurrency: C55. A corrida entre uma correção e um upload simultâneo do mesmo animal está aceita em `Assumptions` (n)
- data lifecycle: C54. Categorias nunca são apagadas (Out of scope); fotos e animais não mudam de ciclo de vida
- dependency failure: existing - banco fora derruba a página com o erro do Next e as rotas respondem `500`, como `/animais` e `POST /api/animals` hoje; as rotas novas não tocam o MinIO
- state transitions: C44, C45, C46, C47, C48
- observability: n/a - nenhum requisito de log ou métrica; erros inesperados seguem o padrão atual das rotas

## Handoff

Tamanhos por `wc -c` dos arquivos que cada slice toca (existentes) mais uma estimativa dos novos:
- S1: 62 KB (`animal-form.tsx` sozinho tem 14,6 KB);
- S2: 16 KB;
- S3: 20 KB;
- S4: 48 KB;
- S5: 36 KB.

Total: 182 KB ÷ 4 ≈ 46k.

- S1-S5 = 46k, under the 150k budget - one builder

- **Boundary:** C1-C58 fechados em `6d579ef` (feature base `0ead62c`). Vitest: unit 74 passed; integration 38 passed (o smoke do compose rodou de novo, sozinho, depois da correção). Playwright: suíte completa com 156 passed
- **Settled mid-build:**
  - o usuário autorizou rodar as provas e o Verifier nesta feature, e o reset dos volumes do Docker. A regra de não rodar testes por conta própria segue valendo fora disso;
  - C12 e C50 (parte da página) foram revistos por decisão do usuário: status `404` → soft 404 com a meta `noindex`. Com `app/loading.tsx`, toda página dinâmica sai em streaming com `200`, e o Next 16 documenta isso;
  - a migração saiu em duas: `0001` adiciona, `0002` apaga o enum antigo. Assim o drizzle-kit não abre a pergunta interativa de renomeação (o `Impact` do plano foi atualizado);
  - o smoke do compose da F1 (C73) passou a esperar também a tabela `categories` e o seed;
  - `assertTouchTargets` passou a esperar o fallback de `app/loading.tsx` sair antes de medir. O `visual.spec.ts` da F1 media a tela de carregamento
- **Abandoned:**
  - `^Taurino` no helper `fillForm`: o nome acessível do cartão começa com o placeholder "foto referência", então a busca passou a usar `\b<categoria>\b`;
  - `allInnerTexts()` logo depois de `router.push`: não espera a página nova, então a prova passou a esperar o chip "Nelore" aparecer;
  - `toHaveCount(1)` na meta `noindex`: o Next injeta duas, então a prova passou a afirmar presença
