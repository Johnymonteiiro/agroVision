# Fluxo de avaliação a partir da Home

## Problem

Quem abre o app cai na lista de Animais, e a aba Home mostra "Em breve". Não existe caminho para
fotografar um bovino e pedir a avaliação Pronto / Não pronto que o design desenha nas telas 1a a 1h:
o técnico que testa o app no campo não vê o fluxo principal do produto, e a equipe não consegue
validar captura, revisão e leitura do resultado com usuários antes do modelo existir.

O modelo treinado ainda não existe (o dataset da F1 está sendo coletado). Hoje, quando o export do
Edge Impulse chegar, toda a interface do fluxo ainda terá de ser construída e testada junto com a
integração do modelo, e a primeira avaliação real fica atrás de duas frentes de trabalho em vez de
uma. O pedido não traz números; a evidência é a aba "Em breve" e o plano parado da F5.

Quando isto entrar: o app abre na Home, "Tirar foto" ou "Escolher da galeria" levam à captura e à
revisão, e "Analisar imagem" mostra "Modelo de IA ainda não disponível" sem inventar resultado.
Com um classificador presente (nos testes, por um gancho), o mesmo fluxo termina nas telas
Pronto, Não pronto e Inconclusivo.

## Flow

Reusa a câmera guiada da F1 (`components/guided-camera.tsx`, com moldura, detector e revisão), a
barra inferior (`components/tab-bar.tsx`), `useOnline` e o gancho de teste do detector como
precedente; nada de câmera ou revisão é reescrito.

1. abertura do app -> `/` (door 3) - a Home (telas 1a/1b) dentro do grupo `app/(tabs)`, com a barra inferior; mostra o chip de conexão e o estado do modelo pedido a `loadClassifier()` (door 1)
2. "Tirar foto" na Home ou botão central da barra -> `/analisar?de=<origem>` (door 3) - fora do grupo `(tabs)`, sem a barra; abre `GuidedCamera` (exists) na posição Lateral, sem peso e com Galeria no lugar do contador; "Cancelar" volta para `de`
3. "Escolher da galeria" na Home -> seletor de arquivos na própria Home; o arquivo segue em memória para `/analisar`, que abre direto na revisão
4. `GuidedCamera` (exists) - revisão da tela 1d; "Analisar imagem" entrega a foto (`Blob`) ao fluxo, só em memória
5. `loadClassifier()` (door 1) - devolve um `Classifier` ou rejeita com `ModelUnavailableError` (sem modelo) ou outro erro (falha ao carregar)
6. `Classifier.classify` (door 1) - recebe a foto decodificada e devolve `{ ready, notReady }`; o pré-processamento do modelo fica dentro do adaptador
7. política de decisão (new, no door - placement per conventions) - compara cada probabilidade com o limiar da classe em `Classifier.model` e devolve `Decision` (door 2) + confiança
8. out: tela de resultado (1f, 1g ou 1h) ou o estado de modelo indisponível / erro; nada é persistido e nenhuma requisição sai para `/api/`

## Impact

| Front | What changes |
| --- | --- |
| domain | new term: `Decision` - `READY`, `NOT_READY` ou `INCONCLUSIVE`, saída da política de decisão; vira valor persistido em `Analysis.decision` quando o registro de avaliações existir (door 2) |
| domain | new term: `ModelInfo` - nome, versão e limiar por classe do modelo carregado; é o embrião de `ModelVersion` (PRD §30) |
| domain | existing term: `threshold` - o PRD §30 usa um escalar (`0.85`), mas o §45 prevê limiar assimétrico; aqui é um limiar por classe. Quem ramifica nele hoje: ninguém no código |
| existing behaviour | `/` deixa de redirecionar para `/animais` e passa a ser a Home. Quem depende disso hoje: o `start_url: "/"` do manifest (o app instalado passa a abrir na Home), o check C22 da F1 (`lista.spec.ts` "raiz redireciona") e a aba Home da barra, que aponta para `/inicio` |
| existing code | some `app/(tabs)/inicio` e `app/page.tsx` (redirect); a página "Em breve" de `app/(tabs)/analisar` dá lugar ao fluxo, que sai do grupo `(tabs)`; `GuidedCamera` ganha a Galeria no controle esquerdo, o modo sem chips de posição e distância e o texto da revisão configurável |
| roadmap | a F5 `avaliacao-offline` encolhe para o adaptador Edge Impulse, o pacote do modelo e o service worker; Home, captura, revisão, análise e resultado saem dela para esta feature |
| stored data | nothing to migrate - nada é gravado no banco, no MinIO nem no navegador |

## Relations

None - no stored-data shape change. A avaliação não é salva nesta feature; `Analysis` nasce com o
registro de avaliações.

## Surface

None - nothing consumed outside. Não há rota de API nova; o fluxo roda no navegador e as rotas de
página que outros pontos passam a usar (`/`, `/analisar`) estão em `Landing`.

## Landing

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| 1. Classificador atrás de uma porta | `type ModelInfo = { name: string; version: string; threshold: { READY: number; NOT_READY: number } }`; `interface Classifier { readonly model: ModelInfo; classify(image: ImageBitmap): Promise<{ ready: number; notReady: number }> }`; `loadClassifier(): Promise<Classifier>` rejeita com `class ModelUnavailableError extends Error` quando não há modelo; gancho de teste `window.__agroClassifier?: () => Promise<Classifier>`, no mesmo molde de `window.__gadoDetector` | telas chamando o `Module` global do Emscripten - acopla a UI ao export e obriga cada teste a carregar o `.wasm`; `classify(pixels: ImageData)` já redimensionado pela UI - o modo de resize é do modelo (pergunta aberta 2 da F5), e mudá-lo depois mexeria em todas as chamadas |
| 2. Vocabulário da decisão | `type Decision = "READY" \| "NOT_READY" \| "INCONCLUSIVE"` | rótulos em português como valor ("PRONTO") - um ajuste de texto viraria migração de `Analysis.decision`; `ready: boolean` + `inconclusive: boolean` - permite o estado impossível pronto-e-inconclusivo |
| 3. Rotas da Home e do fluxo | Home em `/` (`app/(tabs)/page.tsx`, com a barra); fluxo em `/analisar`, fora de `(tabs)`, uma rota só com as etapas em memória (câmera → revisão → analisando → resultado); `/inicio` deixa de existir | uma rota por etapa (`/analisar/revisao`, `/analisar/resultado`) - a foto só existe em memória, e recarregar no meio cairia numa etapa sem foto; Home em `/inicio` - o manifest já fixou `start_url` e `scope` em `/`, e o app instalado abriria num redirect |

- Nothing else in this change is hard to reverse

## Criteria

### S1: Home como tela inicial (P1)

O app abre na Home e dela parte a avaliação.

**Acceptance Criteria**

1. WHEN o usuário abre `/` THEN the system SHALL mostrar a Home, sem redirecionar para `/animais`
2. The system SHALL mostrar no topo da Home o logo do app (36 px) e "AgroVision" em 18 px peso 700, e o chip de conexão à direita
3. WHILE o dispositivo está online the system SHALL mostrar na Home o chip "Online" com o ponto `#18864B`, fundo `#EAF5EF` e texto `#154C35`
4. WHILE o dispositivo está offline the system SHALL mostrar na Home o chip "Offline" com o ícone `cloud_off`, fundo `#EEF0EF` e texto `#3C4641`
5. The system SHALL mostrar na Home o texto "Analise um animal usando a câmera ou uma foto." seguido do cartão "Analisar animal" (26 px peso 700) com "Tire uma foto ou selecione uma imagem", o botão "Tirar foto" (60 px de altura, fundo `#1F6B45`) e o botão "Escolher da galeria" (56 px, fundo `#EAF5EF`)
6. WHILE nenhum modelo está instalado the system SHALL mostrar abaixo do cartão a linha "Modelo de IA ainda não disponível" com o ícone `offline_bolt` em `#68736D`
7. WHERE um modelo está instalado the system SHALL mostrar abaixo do cartão "IA disponível offline" com "Modelo instalado: v<versão>" lido de `Classifier.model.version`
8. The system SHALL mostrar a barra inferior na Home com a aba Home ativa, e a aba Home SHALL levar a `/`

**Independent test:** abrir `/`, ver a Home com o chip, o cartão e "Modelo de IA ainda não disponível"; desligar a rede e ver o chip "Offline".

### S2: Capturar e revisar a foto (P1)

O usuário chega a uma foto que ele confirmou ser boa para análise.

**Acceptance Criteria**

9. WHEN o usuário toca "Tirar foto" na Home ou o botão central "Analisar" da barra THEN the system SHALL abrir `/analisar` na câmera, com a moldura de enquadramento, "Posicione o animal inteiro dentro da área" e as dicas "Fotografe de lado", "Boa iluminação", "Só um animal" e "Corpo inteiro"
10. The system SHALL mostrar na câmera de avaliação "Cancelar" no topo à esquerda, o chip de conexão no topo à direita e, no terço inferior, "Galeria" à esquerda, o disparo de 88 px no centro e "Dicas" à direita, sem os chips de posição e de distância mínima
11. WHILE o usuário está em `/analisar` the system SHALL ocultar a barra inferior
12. WHEN o usuário toca "Escolher da galeria" na Home ou "Galeria" na câmera THEN the system SHALL abrir o seletor de arquivos restrito a `image/*` e, ao escolher, mostrar a revisão com a foto escolhida
13. IF o acesso à câmera é negado THEN the system SHALL mostrar "Permita o acesso à câmera nas configurações do navegador" com "Tentar novamente" e manter "Galeria" disponível
14. WHEN uma foto é tirada ou escolhida THEN the system SHALL mostrar a revisão com a foto, a pergunta "Esta foto está boa para análise?", "Analisar imagem" (60 px, ícone `center_focus_strong`, fundo `#1F6B45`), "Tirar outra foto" (56 px, fundo `#EAF5EF`) e "A análise é realizada no seu dispositivo."
15. WHILE o dispositivo está offline the system SHALL mostrar na revisão "Sem internet — a análise continuará normalmente." e manter "Analisar imagem" habilitado
16. WHEN o usuário toca "Tirar outra foto" na revisão THEN the system SHALL descartar a foto e voltar para a câmera
17. WHEN o usuário toca "Cancelar" na câmera THEN the system SHALL voltar para a tela anterior, ou para `/` quando `/analisar` foi aberto direto
18. The system SHALL não fazer nenhuma requisição a `/api/` do início do fluxo até o resultado

**Independent test:** com a câmera falsa, tirar a foto, ver a revisão, tirar outra, escolher da galeria e ver a revisão de novo, sem nenhuma chamada a `/api/`.

### S3: Analisar e ver o resultado (P1)

A foto vira uma decisão com confiança, calculada no aparelho, ou o aviso honesto de que ainda não há modelo.

**Acceptance Criteria**

19. WHEN o usuário toca "Analisar imagem" THEN the system SHALL mostrar "Analisando animal...", "A inteligência artificial está processando a imagem no seu dispositivo.", a miniatura da foto com a linha de varredura e uma barra indeterminada, sem nenhum número de porcentagem
20. IF o modelo ainda está carregando quando a análise é pedida THEN the system SHALL mostrar "Carregando modelo..." com "Só na primeira abertura." até ele ficar pronto
21. IF nenhum modelo está instalado THEN the system SHALL mostrar "Modelo de IA ainda não disponível", "A avaliação Pronto / Não pronto chega quando o modelo for treinado com as fotos do dataset." e o botão "Voltar ao início", sem mostrar nenhuma decisão nem porcentagem
22. IF o modelo falha ao carregar THEN the system SHALL mostrar "Erro ao carregar o modelo", "Reinicie o app. Se persistir, reinstale o modelo com internet." e o botão "Tentar novamente"
23. IF a foto não pode ser decodificada THEN the system SHALL mostrar "Não foi possível processar esta imagem", "Tente outra foto." e o botão "Tirar outra foto"
24. WHEN a probabilidade READY é maior ou igual ao limiar READY do modelo THEN the system SHALL decidir `READY` (0.85 com limiar 0.85 decide `READY`)
25. WHEN a probabilidade NOT_READY é maior ou igual ao limiar NOT_READY do modelo THEN the system SHALL decidir `NOT_READY` (0.94 com limiar 0.85)
26. IF nenhuma probabilidade alcança o limiar da sua classe THEN the system SHALL decidir `INCONCLUSIVE` (READY 0.62 / NOT_READY 0.38 com limiar 0.85)
27. The system SHALL ler os limiares de `Classifier.model.threshold`, de forma que um limiar READY de 0.90 decide `INCONCLUSIVE` para READY 0.88
28. The system SHALL exibir como confiança a maior das duas probabilidades truncada para porcentagem inteira (0.914 → "91%"; 0.849 → "84%")
29. WHEN a decisão é `READY` THEN the system SHALL mostrar o bloco `#18864B` com o ícone `check_circle` e "PRONTO PARA ABATE", "<n>% de confiança" e a barra de confiança em `#18864B`
30. WHEN a decisão é `NOT_READY` THEN the system SHALL mostrar o bloco `#C74A3A` com o ícone `cancel` e "NÃO PRONTO PARA ABATE", "<n>% de confiança" e a barra em `#C74A3A`
31. WHEN a decisão é `INCONCLUSIVE` THEN the system SHALL mostrar o bloco `#E8A93A` com texto `#2E2206`, o ícone `help` e "RESULTADO INCONCLUSIVO", a barra com uma marca no limiar rotulada "mínimo <limiar READY>%", "A IA não conseguiu determinar o resultado com confiança suficiente. Uma nova foto costuma resolver." e as orientações "Tire outra foto com o animal inteiro visível.", "Evite sombras fortes." e "Fotografe o animal lateralmente."
32. WHEN a decisão é `INCONCLUSIVE` THEN the system SHALL oferecer "Tirar outra foto" como ação primária, que volta para a câmera
33. WHEN a decisão é `READY` ou `NOT_READY` THEN the system SHALL oferecer "Nova avaliação" como ação primária, que volta para a câmera
34. The system SHALL mostrar em todo resultado a foto analisada no topo, o botão fechar (`close`) que leva a `/`, as linhas "Modelo" (`<name> v<version>`) e "Data" (`25 out 2026, 09:42`), e o aviso "Este resultado é uma estimativa gerada pelo modelo de IA."
35. The system SHALL nunca exibir as palavras "autorizado" ou "aprovado" em nenhuma tela do fluxo
36. The system SHALL dar a todo controle tocável da Home e do fluxo pelo menos 44 × 44 px, e às ações principais altura entre 56 e 60 px

**Independent test:** com o app real, "Analisar imagem" termina em "Modelo de IA ainda não disponível"; com um classificador falso pelo gancho, as três decisões aparecem com cor, ícone, confiança e modelo.

## Out of scope

| Excluded | Why |
| --- | --- |
| Adaptador Edge Impulse, pacote do modelo em `public/model/`, pré-processamento da imagem | F5 `avaliacao-offline` - o export do modelo ainda não existe |
| Service worker e abrir o app sem rede | feature própria junto com o modelo (decisão do usuário em 2026-10-25) |
| Salvar a avaliação, "Salvar mesmo assim", "Ver detalhes", linha "Status" do resultado, Histórico | registro de avaliações - exige persistência que esta feature não introduz |
| "Identificar animal" / chip do animal no resultado, vínculo na revisão | vínculo com animal - depende do registro de avaliações |
| Banner offline com pendências, "Última sincronização", sincronização | fila offline e sincronização - não existe nada pendente sem persistência |
| Subtítulo da fazenda no topo da Home | não existe entidade fazenda (decisão aberta 5 do PRD) |
| Botão de flash na câmera (design 1c) | controle de lanterna não faz parte da câmera da F1; entra com pedido próprio |
| Quality check "Nenhum bovino encontrado" | P2 no PRD (§41) |

## Assumptions

| Assumption | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Marca no topo da Home | o logo do app (`app/icon.png`) no lugar do quadrado verde com `eco` do design | o usuário definiu o logo e o nome AgroVision depois do design | n |
| Ambas as probabilidades acima do limiar | decide a classe de maior probabilidade | com limiares ≥ 0,5 e soma 1 isso não acontece; a regra só evita um estado indefinido | n |
| Estado do modelo na Home | a Home chama `loadClassifier()` ao abrir e mostra a linha do critério 6 ou 7 conforme o resultado | sem modelo a rejeição é imediata; com modelo, o carregamento antecipado encurta a primeira análise | n |
| Câmera de avaliação | a posição é sempre Lateral e o detector de enquadramento da F1 continua ligado | o design 1c pede "Fotografe de lado" e mostra a moldura verde | n |
| Formato da data | dia, mês abreviado em português, ano e hora (`25 out 2026, 09:42`) | é o formato do design 1f com a data de hoje | n |

**Open questions:** duas seguem abertas.

| # | Kind | Question | Until answered |
| --- | --- | --- | --- |
| 1 | blocks go-live | Quando o export WebAssembly do Edge Impulse (e as imagens de referência) vai existir? | o app real sempre termina em "Modelo de IA ainda não disponível" (critério 21); os critérios 24-34 são provados com um classificador falso pelo gancho |
| 2 | open | O design não tem a tela de modelo indisponível | o texto do critério 21 segue o tom do estado de erro do design 1q; trocar é editar duas strings |

## Observable

| Surface | Decision | Landing |
| --- | --- | --- |
| screen Home | empty state | n/a - a Home não lista dados; o resumo de avaliações é do registro de avaliações |
| screen Home | loading state | AC 6 - sem modelo a rejeição de `loadClassifier()` é imediata; a linha do modelo só aparece resolvida |
| screen Home | error state | AC 6 - falha ao consultar o modelo é tratada como modelo não disponível na Home; o erro detalhado aparece na análise (AC 22) |
| screen Home | unauthorised state | n/a - o MVP não tem contas nem login |
| screen Home | density and ordering | AC 2, AC 5, AC 6, AC 8 |
| screen Home | offline state | AC 3, AC 4 |
| screen câmera | loading state | existing - a câmera da F1 mostra "Carregando guia de enquadramento..." enquanto o detector carrega |
| screen câmera | error / unauthorised (permissão negada) | AC 13 |
| screen câmera | destructive action confirms | n/a - "Cancelar" descarta uma foto que nunca foi salva |
| screen câmera | density and ordering | AC 9, AC 10 |
| screen revisão | offline state | AC 15 |
| screen revisão | destructive action confirms | n/a - "Tirar outra foto" descarta uma foto que nunca foi salva |
| screen analisando | loading state | AC 19, AC 20 |
| screen analisando | error state | AC 21, AC 22, AC 23 |
| screen resultado | states | AC 29, AC 30, AC 31 |
| screen resultado | error state | n/a - a tela só é alcançada com uma decisão calculada |
| screen resultado | destructive action confirms | n/a - nada é salvo nesta feature, logo nada é excluído |
| copy do resultado | tom e próximo passo | AC 31, AC 32, AC 33, AC 34 |
| copy do resultado | vocabulário proibido | AC 35 |
| all screens | touch targets | AC 36 |

## Sources

- Binding: Claude Design, projeto "Gado Certo UI mockups", arquivo `Gado Certo - Telas.dc.html` (https://claude.ai/design/p/96e99ff6-cd1e-4d21-b9d1-afca323c5bc7) - telas 1a, 1b, 1c, 1d, 1e, 1f, 1g, 1h e os estados de 1q; os desvios estão em `Out of scope` e `Assumptions`
- `PRD v1.1.md` - §7 (navegação), §8 (fluxo), §13-17 (decisão e limiar), §40 (inconclusivo)
- `.specs/features/avaliacao-offline/plan.md` - doors 1 e 2 e os critérios de decisão, trazidos para cá; o restante continua na F5
