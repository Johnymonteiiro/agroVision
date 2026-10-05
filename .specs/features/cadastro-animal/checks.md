# Cadastro de animal e fotos por posição - checks

Profile: ui
Plan: `.specs/features/cadastro-animal/plan.md`

## Intent

76 checks in 7 slices · 12 one-way doors · 3 open, of which 0 block (2 block go-live)

## Checks

Proofs run with `pnpm vitest run <file> -t "<name>"` (unit and integration; integration needs
the `db` and `minio` services of `docker compose`) and `pnpm playwright test <file> -g "<name>"`
(E2E in Chromium against `next start`, with the same services).

### S1 - Cadastrar o animal · 9 files · 46 KB · ~12k

**C1** - Preencher os cinco campos e tocar "Salvar animal" responde `201` em `POST /api/animals` e abre `/animais/{id}` (AC 1)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "salvar cria o animal e abre o perfil"`
Proof: `pnpm vitest run tests/integration/api-animals.test.ts -t "POST valido responde 201"`

**C2** - `/animais/novo` mostra "Novo animal", o botão com o ícone `close` e os blocos na ordem Identificação, Categoria, Idade, Peso, Sexo, Prévia do card (AC 2)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "ordem dos campos"`

**C3** - Com 0 a 4 campos preenchidos, "Salvar animal" está desabilitado com fundo `#EEF0EF` e texto `#9AA39E`, e o rodapé mostra "X de 5 preenchidos" com o X certo (AC 3)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "contador e botao desabilitado"`

**C4** - Com os cinco campos, o rodapé mostra "5 de 5 preenchidos" com `check_circle` em `#18864B` e o botão fica habilitado com fundo `#1F6B45` (AC 4)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "cinco de cinco habilita salvar"`

**C5** - A categoria aparece como os cartões "Taurino" / "Sem cupim" e "Zebu" / "Com cupim"; o escolhido ganha borda `#1F6B45` e um check (AC 5)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "cartoes de categoria"`

**C6** - O sexo aparece como "Macho" com o ícone `male` e "Fêmea" com o ícone `female` (AC 6)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "botoes de sexo"`

**C7** - A idade vem com o seletor "Meses" | "Anos", "Meses" marcado por padrão; digitar 24 mostra "24 meses" no campo e "= 2 anos" abaixo (AC 7)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "idade com unidade e conversao"`

**C8** - O campo de peso mostra a unidade "kg" dentro dele (AC 8)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "peso com kg"`

**C9** - Com identificação 023, Taurino, 24 meses, 485 kg e Macho, a prévia mostra "Animal #023", "Taurino • Macho" e "24 meses • 485 kg" (AC 9)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "previa do card"`

**C10** - 24 meses e 2 anos informados em 2026-10-04 dão `birth_date_estimated` = 2024-10-04, e o valor gravado pela API é hoje menos a idade (AC 10)
Proof: `pnpm vitest run tests/unit/age.test.ts -t "data de nascimento estimada"`
Proof: `pnpm vitest run tests/integration/api-animals.test.ts -t "grava birth_date_estimated"`
Done: yes

**C11** - A idade exibida é "24 meses" para 24 meses, "35 meses" para 35 e "3 anos" para 36 (AC 11)
Proof: `pnpm vitest run tests/unit/age.test.ts -t "idade exibida"`
Done: yes

**C12** - Peso 29, 1501 e 450,5 são rejeitados com "Confira o peso informado"; 30 e 1500 são aceitos; o formulário não envia com o peso rejeitado (AC 12)
Proof: `pnpm vitest run tests/unit/animal-validation.test.ts -t "limites de peso"`
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "peso fora da faixa"`

**C13** - Identificação vazia e com 21 caracteres é rejeitada com "Informe uma identificação de até 20 caracteres"; 1 e 20 caracteres são aceitos (AC 13)
Proof: `pnpm vitest run tests/unit/animal-validation.test.ts -t "limites da identificacao"`
Done: yes

**C14** - Com "A12" cadastrado, salvar "a12 " mostra "Já existe um animal com este ID." no campo de identificação e fica em `/animais/novo` (AC 14)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "identificacao duplicada"`

**C15** - `POST /api/animals` com a identificação de outro animal (diferindo só em maiúsculas e espaços) responde `409` com `fields.externalId` e a contagem de animais não muda (AC 15)
Proof: `pnpm vitest run tests/integration/api-animals.test.ts -t "identificacao duplicada responde 409"`
Done: yes

**C16** - Digitar 1501 no peso não mostra erro; sair do campo mostra "Confira o peso informado" com o ícone `error` e texto `#B23E2F` (AC 16)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "erro so ao sair do campo"`

**C17** - Os campos de idade e peso têm `inputmode="numeric"` (AC 17)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "teclado numerico"`

**C18** - Offline, com os cinco campos preenchidos, "Salvar animal" fica desabilitado e aparece "Sem internet — conecte-se para salvar." (AC 18)
Proof: `pnpm playwright test tests/e2e/cadastro.spec.ts -g "offline desabilita salvar"`

**C19** - Repetir `POST /api/animals` com o mesmo `id` responde `200` com o animal gravado e a contagem continua 1 (AC 19)
Proof: `pnpm vitest run tests/integration/api-animals.test.ts -t "mesmo id responde 200"`
Done: yes

**C20** - `POST /api/animals` sem `category` e com `weightKg` 10 responde `422` com `fields.category` e `fields.weightKg` e nada é gravado (AC 20)
Proof: `pnpm vitest run tests/integration/api-animals.test.ts -t "corpo invalido responde 422"`
Done: yes

**C21** - Dois `POST /api/animals` simultâneos com a mesma identificação e `id`s diferentes resultam em um `201`, um `409` e uma linha (porta 6)
Proof: `pnpm vitest run tests/integration/api-animals.test.ts -t "concorrencia na identificacao"`
Done: yes

### S2 - Encontrar o animal na lista · 4 files · 22 KB · ~6k

**C22** - Abrir `/` termina em `/animais` (AC 21)
Proof: `pnpm playwright test tests/e2e/lista.spec.ts -g "raiz redireciona"`

**C23** - Com 2 animais, `/animais` mostra "Animais", "2 cadastrados" e "Adicionar animal", que abre `/animais/novo` (AC 22)
Proof: `pnpm playwright test tests/e2e/lista.spec.ts -g "cabecalho da lista"`

**C24** - Os itens aparecem do mais recente para o mais antigo, cada um com miniatura de 76 px, "Animal #023", "Taurino • Macho", "24 meses • 485 kg" e "Última foto:" (AC 23)
Proof: `pnpm playwright test tests/e2e/lista.spec.ts -g "item e ordem"`

**C25** - Um animal com 2 fotos mostra o selo "2 FOTOS"; um sem foto mostra "SEM FOTOS" (AC 24)
Proof: `pnpm playwright test tests/e2e/lista.spec.ts -g "selo de fotos"`

**C26** - Buscar "a1" mostra "A12" e esconde "B7" (AC 25)
Proof: `pnpm playwright test tests/e2e/lista.spec.ts -g "busca por identificacao"`

**C27** - Com um Taurino macho e uma Zebu fêmea, cada chip mostra exatamente o grupo dele: Todos 2, Taurino 1, Zebu 1, Machos 1, Fêmeas 1 (AC 26)
Proof: `pnpm playwright test tests/e2e/lista.spec.ts -g "chips de filtro"`

**C28** - Sem animais, `/animais` mostra o ícone `sell`, "Nenhum animal cadastrado" e o botão "Adicionar animal" (AC 27)
Proof: `pnpm playwright test tests/e2e/lista.spec.ts -g "estado vazio"`

**C29** - Uma busca sem resultado mostra "Nenhum animal encontrado" (AC 28)
Proof: `pnpm playwright test tests/e2e/lista.spec.ts -g "busca sem resultado"`

### S3 - Fotografar por posição com guia · 12 files · 64 KB · ~16k

**C30** - Tocar "Fotografar animal" abre a escolha entre "De trás", "De cima" e "Lateral" antes de qualquer `getUserMedia` (AC 29)
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "escolhe posicao antes da camera"`

**C31** - A câmera mostra "Cancelar" no topo à esquerda, o chip de conexão no topo à direita, "Posicione o animal inteiro dentro da área", a moldura, quatro dicas, e o contador, o disparo de 88 px e "Dicas" no terço inferior da tela (AC 30)
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "layout da camera"`

**C32** - A primeira dica é "Fotografe por trás" em De trás, "Fotografe de cima" em De cima e "Fotografe de lado" em Lateral, seguida de "Boa iluminação", "Só um animal" e "Corpo inteiro" (AC 31)
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "dicas por posicao"`

**C33** - Para um quadro 1000 × 750 mostrado em 1000 × 750 px, a moldura vai de (50, 37,5) a (950, 712,5) (AC 32)
Proof: `pnpm vitest run tests/unit/guide-rect.test.ts -t "moldura recuada 5 por cento"`
Done: yes

**C34** - A distância é exibida arredondada para cima em 0,1 m com vírgula: 2,093 → "2,1 m", 2,0 → "2,0 m", 2,01 → "2,1 m" (AC 33)
Proof: `pnpm vitest run tests/unit/min-distance.test.ts -t "formato da distancia"`
Done: yes

**C35** - A fórmula vale para as três posições nas duas orientações (450 kg, 65°, 4:3): Lateral 2,1 / 2,8; De trás 1,7 / 1,3; De cima 2,1 / 2,8 (horizontal / vertical, em m) (AC 34)
Proof: `pnpm vitest run tests/unit/min-distance.test.ts -t "tres posicoes nas duas orientacoes"`
Done: yes

**C36** - Um animal de 225 kg na Lateral, 65°, 4:3 horizontal, mostra "Distância mínima: 1,7 m" (AC 35)
Proof: `pnpm vitest run tests/unit/min-distance.test.ts -t "escala pelo peso"`
Done: yes

**C37** - Lateral, 450 kg, 65°, quadro 4:3 horizontal mostra "Distância mínima: 2,1 m" (AC 36)
Proof: `pnpm vitest run tests/unit/min-distance.test.ts -t "lateral 450 kg horizontal"`
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "mostra distancia minima"`

**C38** - O mesmo animal com o celular na vertical (quadro 3:4) mostra "Distância mínima: 2,8 m" (AC 37)
Proof: `pnpm vitest run tests/unit/min-distance.test.ts -t "lateral 450 kg vertical"`
Done: yes

**C39** - Uma caixa `cow` com score 0,8 de (10%, 20%) a (90%, 80%) é `FRAMED`, e a tela mostra "Enquadrado" com os cantos em `#7FD1A3` (AC 38)
Proof: `pnpm vitest run tests/unit/framing.test.ts -t "enquadrado"`
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "estado enquadrado"`

**C40** - Uma caixa de (2%, 20%) a (90%, 80%) é `OUT_OF_FRAME`, e a tela mostra "Afaste-se — o animal não cabe no quadro" com os cantos em `#E8A93A` (AC 39)
Proof: `pnpm vitest run tests/unit/framing.test.ts -t "fora do quadro"`
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "estado afaste-se"`

**C41** - Uma caixa de (30%, 30%) a (70%, 70%) é `TOO_FAR`, e a tela mostra "Aproxime-se" com os cantos em `#E8A93A` (AC 40)
Proof: `pnpm vitest run tests/unit/framing.test.ts -t "longe demais"`
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "estado aproxime-se"`

**C42** - Nenhuma caixa, ou uma `cow` com score 0,49, é `NOT_DETECTED`, e a tela mostra "Animal não detectado" com os cantos brancos (AC 41)
Proof: `pnpm vitest run tests/unit/framing.test.ts -t "nao detectado"`
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "estado nao detectado"`

**C43** - Enquanto o detector carrega, a câmera mostra "Carregando guia de enquadramento..." e já mostra "Distância mínima: 2,1 m" (AC 42)
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "detector carregando"`

**C44** - Se o detector falha ao carregar, a câmera mostra "Guia de enquadramento indisponível", o disparo continua habilitado e o estado é `UNAVAILABLE` (AC 43)
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "detector indisponivel"`

**C45** - Em cada um dos 5 estados o disparo está habilitado, e o `framing` enviado é o estado do instante do disparo (AC 44)
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "disparo em todos os estados"`

**C46** - Depois do disparo, a revisão mostra a foto com altura entre 60% e 72% da tela, "Esta foto está boa para o dataset?", a posição, o estado de enquadramento, "Usar foto" com fundo `#1F6B45` e "Tirar outra foto" com fundo `#EAF5EF` (AC 45)
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "layout da revisao"`

**C47** - "Tirar outra foto" volta à câmera sem nenhuma requisição a `/api/animals/{id}/images` (AC 46)
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "tirar outra descarta"`

**C48** - Duas vezes "Usar foto" na Lateral fazem dois `POST` com `position=SIDE`, voltam à câmera na Lateral e o contador mostra "2 fotos" (AC 47)
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "usar foto envia e conta"`

**C49** - "Cancelar" na câmera volta para `/animais/{id}` (AC 48)
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "cancelar volta ao perfil"`

**C50** - Com `getUserMedia` rejeitando com `NotAllowedError`, a câmera mostra "Permita o acesso à câmera nas configurações do navegador" e "Tentar novamente" (AC 49)
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "permissao negada"`

**C51** - Offline, a revisão desabilita "Usar foto" e mostra "Sem internet — conecte-se para enviar." (AC 50)
Proof: `pnpm playwright test tests/e2e/camera.spec.ts -g "offline desabilita usar foto"`

**C52** - A câmera carrega o `.wasm` e o `.tflite` do detector de `/mediapipe/` e não faz nenhuma requisição a `cdn.jsdelivr.net` nem a `storage.googleapis.com` (porta 9)
Proof: `pnpm playwright test tests/e2e/detector.spec.ts -g "detector servido localmente"`

**C53** - O detector real encontra `cow` com score ≥ 0,5 na foto de referência `tests/fixtures/cow-side.jpg` (porta 9)
Proof: `pnpm playwright test tests/e2e/detector.spec.ts -g "detecta vaca na foto de referencia"`

### S4 - Guardar a foto comprimida · 8 files · 40 KB · ~10k

**C54** - Uma foto 4000 × 3000 sem rotação enviada por `POST /api/animals/{id}/images` responde `201` e o JPEG gravado tem 2048 × 1536 e nenhum EXIF (AC 51)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "foto horizontal vira 2048x1536 sem exif"`
Done: yes

**C55** - Uma foto 4000 × 3000 com EXIF `Orientation` = 6 é gravada como JPEG 1536 × 2048 (AC 52)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "orientacao 6 vira retrato"`
Done: yes

**C56** - A miniatura de uma foto 4000 × 3000 é um WebP de 320 × 240 (AC 53)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "miniatura webp 320"`
Done: yes

**C57** - Os objetos existem em `animal-images` nas chaves `animals/{animalId}/SIDE/{imageId}.jpg` e `animals/{animalId}/SIDE/{imageId}_thumb.webp` (AC 54)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "chaves no bucket"`
Done: yes

**C58** - A linha da imagem grava `SIDE`, `FRAMED`, a distância 2,1, `capturedAt`, 2048, 1536, o tamanho em bytes do JPEG, `weight_kg_at_capture` = 485 e `age_months_at_capture` = 24 (AC 55)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "linha com snapshots"`
Done: yes

**C59** - Um arquivo de 15 MB + 1 byte responde `413` e não deixa objeto nem linha (AC 56)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "arquivo grande responde 413"`
Done: yes

**C60** - Um arquivo de texto enviado como foto responde `415` e não deixa objeto nem linha (AC 57)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "nao imagem responde 415"`
Done: yes

**C61** - Enviar para um animal inexistente responde `404` e não deixa objeto nem linha (AC 58)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "animal inexistente responde 404"`
Done: yes

**C62** - `position` = `FRONT` responde `422`, e `framing` = `OK` responde `422`, sem objeto nem linha (AC 59)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "enum invalido responde 422"`
Done: yes

**C63** - Com o armazenamento recusando a gravação, a rota responde `503` e nenhuma linha é criada (AC 60)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "armazenamento fora responde 503"`
Done: yes

**C64** - Com o banco falhando depois do upload, os dois objetos gravados são apagados e a rota responde `500` (AC 61)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "falha no banco apaga objetos"`
Done: yes

**C65** - Reenviar o mesmo `imageId` responde `200` com a imagem existente, e o bucket e a tabela continuam com um item (AC 62)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "mesmo imageId responde 200"`
Done: yes

**C66** - `GET /api/images/{id}?variant=thumb` responde `200` `image/webp`, `variant=full` responde `200` `image/jpeg`, e um id inexistente responde `404` (AC 63)
Proof: `pnpm vitest run tests/integration/api-images.test.ts -t "leitura de imagem"`
Done: yes

**C67** - Uma leitura anônima direta no MinIO de um objeto de `animal-images` recebe `403` (AC 64)
Proof: `pnpm vitest run tests/integration/bucket-policy.test.ts -t "leitura anonima negada"`
Done: yes

### S5 - Ver o animal e as fotos por posição · 4 files · 20 KB · ~5k

**C68** - A foto principal é a lateral mais recente; sem lateral, a mais recente de outra posição; sem foto, nenhuma (AC 65)
Proof: `pnpm vitest run tests/unit/main-photo.test.ts -t "regra da foto principal"`
Done: yes

**C69** - Um animal sem fotos mostra no topo do perfil o placeholder com o ícone `photo_camera` e o botão voltar, que leva a `/animais` (AC 65)
Proof: `pnpm playwright test tests/e2e/perfil.spec.ts -g "topo sem foto"`

**C70** - O cartão do perfil mostra "Animal #023" em 26 px peso 700, "Taurino • Macho", "24 meses • 485 kg", a grade Categoria "Taurino" / Sexo "Macho" / Idade "24 m" / Peso "485 kg" e o botão "Fotografar animal" (AC 66)
Proof: `pnpm playwright test tests/e2e/perfil.spec.ts -g "cartao do perfil"`

**C71** - Com duas fotos laterais, a seção Lateral mostra "2 fotos" e as miniaturas da mais recente para a mais antiga (AC 67)
Proof: `pnpm playwright test tests/e2e/perfil.spec.ts -g "fotos por posicao"`

**C72** - As seções De trás e De cima, sem fotos, mostram "Nenhuma foto" e "Adicionar fotos", que abre a câmera já na posição (AC 68)
Proof: `pnpm playwright test tests/e2e/perfil.spec.ts -g "posicao vazia"`

### S6 - Subir com Docker · 5 files · 9 KB · ~3k

**C73** - Depois de `docker compose down -v`, `docker compose up -d --wait` deixa o bucket privado `animal-images` criado, as migrações aplicadas e `GET http://localhost:3000/animais` respondendo `200` (AC 69)
Proof: `pnpm vitest run tests/infra/compose-smoke.test.ts -t "sobe do zero"`

### S7 - Linguagem visual · 3 files · 9 KB · ~3k

**C74** - Nas telas da feature o texto usa Geist, os ícones usam "Material Symbols Rounded", o fundo é `#F6F8F7`, o texto principal `#17211C`, o secundário `#68736D` e o botão primário `#1F6B45` (AC 70)
Proof: `pnpm playwright test tests/e2e/visual.spec.ts -g "tokens do design system"`

**C75** - Nenhuma tela faz requisição a `fonts.googleapis.com` ou `fonts.gstatic.com` (porta 11)
Proof: `pnpm playwright test tests/e2e/visual.spec.ts -g "fontes servidas localmente"`

**C76** - Em `/animais`, `/animais/novo`, perfil, câmera e revisão, todo botão e link tem pelo menos 44 × 44 px e as ações principais têm altura entre 56 e 60 px (AC 71)
Proof: `pnpm playwright test tests/e2e/visual.spec.ts -g "areas de toque"`

## Coverage

| Set (size) | Member -> proof | Unproven |
| --- | --- | --- |
| `POST /api/animals` statuses (4) | 201 C1 · 200 C19 · 409 C15 · 422 C20 | - |
| `POST /api/animals/{id}/images` statuses (8) | 201 C54 · 200 C65 · 404 C61 · 413 C59 · 415 C60 · 422 C62 · 500 C64 · 503 C63 | - |
| `GET /api/images/{id}` statuses (2) | 200 C66 · 404 C66 | - |
| position × orientation -> distance (6) | C35, table-driven over all 6 | - |
| position -> first tip (3) | `REAR` C32 · `TOP` C32 · `SIDE` C32 | - |
| framing state shown (5) | `FRAMED` C39 · `OUT_OF_FRAME` C40 · `TOO_FAR` C41 · `NOT_DETECTED` C42 · `UNAVAILABLE` C44 | - |
| framing state sent on capture (5) | C45, table-driven over all 5 | - |
| invalid enum on upload (2) | `position` C62 · `framing` C62 | - |
| list chips (5) | `Todos` C27 · `Taurino` C27 · `Zebu` C27 · `Machos` C27 · `Fêmeas` C27 | - |
| weight bound (5 edges) | 29 C12 · 30 C12 · 1500 C12 · 1501 C12 · 450,5 C12 | - |
| identification length (4 edges) | 0 C13 · 1 C13 · 20 C13 · 21 C13 | - |
| age display (3) | 24 C11 · 35 C11 · 36 C11 | - |
| age unit (2) | `Meses` C10 · `Anos` C10 | - |
| orientation (2) | horizontal C37 · vertical C38 | - |
| main photo rule (3) | lateral C68 · other position C68 · none C68 | - |
| capture flow transitions (4) | câmera -> revisão C46 · revisão -> câmera por "Tirar outra foto" C47 · revisão -> câmera por "Usar foto" C48 · câmera -> perfil C49 | - |
| Landing doors (13) | 1 compose C73 · 2 migrações C73 · 3 chaves C57 · 4 compressão C54 · 5 rota com id do cliente C19 · 6 unicidade C15 · 7 enums C62 · 8 snapshots C58 · 9 detector local C52 · 10 ferramental C1 · 11 ícones C75 · 12 tokens C74 · 13 imagem do MinIO C73 | - |
| entities (2) | `Animal` C1 · `AnimalImage` C58 | - |
| startup config: `DATABASE_URL` and `S3_*` (3 assemblies) | `app` do compose C73 · harness do Vitest C54 · `webServer` do Playwright C1 | - |

- Claims naming a status code, route or response shape: C1, C15, C19, C20, C21, C54-C67 - each proof invokes the exported route handler with a real `Request` against the real Postgres and MinIO, or reads the bucket over HTTP (C67); C1 also crosses HTTP through the browser
- C39-C42 have a proof at the decision layer (`framing.test.ts`) and one at the screen; the screen proof injects the detection, so the real detector is proven separately by C53
- No other check claims more than the single case its proof exercises

## Test policy

The repo has no tests and no testing guideline, so neither question is answered; these rows are
the bar this build runs under.

| Code | Required proofs | Coverage expectation |
| --- | --- | --- |
| Decides, reached across a boundary | one at the boundary **and** one at its own layer | the contract at the boundary; one asserted case per row of the decision table at its own layer |
| Decides, not reached across a boundary | one at its own layer | one asserted case per row of the decision table |
| Entry point that decides nothing | one at the boundary | accepted input, each rejected input, each error path |
| Instrumentation, pass-throughs | none of its own | covered by its consumer's proof |

Evidence (planned shape; the repo has no code yet):

- distância mínima: 3 posições × 2 orientações, arredondamento -> decides, not reached across a boundary
- classificador de enquadramento: 5 estados, 4 limiares -> decides, reached by the camera screen
- validação do animal: 5 campos, 9 bordas -> decides, reached across `POST /api/animals`
- rota de upload: 8 status, rollback na falha parcial -> decides, reached across HTTP
- cliente do MinIO e conexão do banco: repassam chamadas -> instrumentation
- closest analogue in the repo: none - first feature with code

Cost: 5 proofs at their own layer across 5 files (`age`, `animal-validation`, `min-distance`,
`framing`, `main-photo`). Without these rows the distance table and the framing table would be
proven only through the camera screen, one path at a time.

## Swept

- validation: C12, C13, C20, C62
- failure modes: C64
- idempotency: C19, C65
- authorization: n/a - sem login no MVP; a pergunta aberta 1 (blocks go-live) restringe o uso à rede local
- concurrency: C21
- data lifecycle: n/a - nada é excluído nesta feature; os objetos órfãos de uma falha parcial são removidos em C64
- dependency failure: C63, C44
- state transitions: C46, C47, C48, C49
- observability: n/a - nenhum requisito de log ou métrica; o enquadramento gravado em cada foto (C45) é o sinal de curadoria do dataset

## Handoff

Tamanhos estimados pelo conteúdo que cada slice cria (repositório vazio, `wc -c` não se aplica):
S1 46 KB + S2 22 KB + S3 64 KB + S4 40 KB + S5 20 KB + S6 9 KB + S7 9 KB = 210 KB ÷ 4 ≈ 53k.

- S1-S4 = 44k, cruzam API, banco, MinIO e câmera; S5-S7 levam a 53k no total, abaixo do budget de 150k - one builder
