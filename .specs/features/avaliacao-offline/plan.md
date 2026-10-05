# Avaliação offline (F1 - prova de conceito)

## Problem

Quem decide se um bovino está pronto para abate faz isso no campo, onde a internet é limitada,
instável ou inexistente (PRD §2). Hoje essa decisão depende do olho de alguém experiente: não
existe uma segunda opinião objetiva disponível no momento em que o animal está na frente da
pessoa, e qualquer ferramenta que dependa de API externa falha justamente onde ela é usada.

A equipe também não sabe se um modelo Edge Impulse em WebAssembly roda num Android
intermediário, sem rede, dentro dos 3 s que o PRD fixa como meta (§35, "a validar na Fase 1").
O PRD não traz números de volume ou de tempo perdido; a evidência é qualitativa.

Quando isto entrar: com o app instalado e o celular sem Wi-Fi e sem dados, o usuário fotografa
um bovino e vê Pronto / Não pronto / Inconclusivo com a confiança, e a equipe consegue medir o
tempo do toque em "Analisar imagem" até o resultado.

## Flow

Reusa o root layout e o carregamento de Geist / Geist Mono via `next/font` que já existem; não
há outro código a reaproveitar (o repositório é o template do create-next-app).

1. abertura do app -> `app/layout.tsx` (exists) - passa a declarar `lang="pt-BR"`, os tokens do design system e registra o service worker `app/sw.ts` (door 2); o web manifest vem de `app/manifest.ts` (door 3)
2. `app/sw.ts` (door 2) - no install pré-cacheia o shell, `/`, `/analisar` e os arquivos de `public/model/` (door 4); depois disso todas as rotas abrem sem rede
3. toque em "Tirar foto" / "Escolher da galeria" na Home, ou no botão central -> rota `/analisar` (new, no door - placement per conventions) - câmera via `getUserMedia` ou seletor de arquivo; entrega um `Blob` da foto à revisão, só em memória
4. revisão -> "Analisar imagem" -> processador de imagem (new, no door - placement per conventions) - decodifica, faz crop/resize para `inputWidth × inputHeight` lidos do manifesto do modelo (door 4) e converte os pixels para o vetor de features
5. `Classifier` (door 1) - adaptador do Edge Impulse: carrega `edge-impulse-standalone.js/.wasm`, classifica e devolve `{ ready, notReady }` usando o mapeamento de rótulos do manifesto
6. política de decisão (new, no door - placement per conventions) - compara cada probabilidade com o limiar da classe no manifesto e devolve `READY | NOT_READY | INCONCLUSIVE` + confiança
7. out: tela de resultado; nada é persistido nesta feature (IndexedDB entra na F2)

## Impact

| Front | What changes |
| --- | --- |
| domain | new term: `Decision` - `READY`, `NOT_READY` ou `INCONCLUSIVE`, saída da política de decisão; o nome vira valor persistido em `Analysis.decision` na F2 |
| domain | new term: `ModelManifest` - nome, versão, entrada, rótulos e limiares do modelo empacotado; é o embrião de `ModelVersion` (§30) que a F6 passa a persistir e atualizar |
| domain | existing term: `threshold` no PRD é um escalar (`0.85`, §30) mas o §45 já prevê limiar assimétrico; aqui vira um limiar por classe - quem ramifica nele hoje: ninguém no código, mas `Analysis.decisionThreshold` (§29) da F2 terá de gravar os dois |
| domain | nome do produto: "AgroVision" (PRD) × "Gado Certo" (mockups) - aparece no rótulo do ícone instalado e no cabeçalho da Home |
| stored data | nothing to migrate - não há dados; só o Cache Storage do service worker é criado |
| existing code | `app/page.tsx`, `app/layout.tsx` e `app/globals.css` do template são substituídos; `next.config.ts` ganha `withSerwist` e `experimental.useOffline` |

## Relations

None - no stored-data shape change. Esta feature não grava nada no IndexedDB; as entidades
`Analysis`, `Image` e `ModelVersion` nascem na F2 / F6.

## Surface

None - nothing consumed outside. Não há API nem backend nesta feature; o que o navegador
consome e não pode mudar depois (escopo do manifest, URL do service worker, layout de
`public/model/`) está em `Landing`.

## Landing

| One-way door | Literal shape | Alternative rejected |
| --- | --- | --- |
| 1. Modelo atrás de uma porta | `interface Classifier { load(): Promise<void>; classify(pixels: ImageData): Promise<{ ready: number; notReady: number }> }`; uma única implementação `EdgeImpulseClassifier` encapsula o `Module` global do Emscripten | telas chamando `Module.run_classifier` direto - acopla toda a UI ao global do Emscripten e obriga cada teste a carregar o `.wasm` real |
| 2. Service worker | `@serwist/turbopack` + `serwist` + `esbuild` (devDependencies); fonte em `app/sw.ts`, rota `app/serwist/[path]/route.ts`, servido em `/serwist/sw.js`, `additionalPrecacheEntries` com os arquivos de `public/model/` | `public/sw.js` escrito à mão - não conhece os assets com hash de `/_next/static`, então "offline após a primeira abertura" passa a depender de quais telas foram visitadas; `@serwist/next` - só webpack, e o Next 16 builda com Turbopack |
| 3. Identidade da PWA | `app/manifest.ts` com `id: "/"`, `scope: "/"`, `start_url: "/"`, `display: "standalone"`, `lang: "pt-BR"`, ícones 192 e 512 px | escopo `/app/` - as rotas não têm prefixo, e mudar `id`/`scope` depois deixa as instalações existentes órfãs |
| 4. Pacote do modelo | `public/model/manifest.json` = `{ "name": "CattleClassifier", "version": "1.4.0", "inputWidth": 96, "inputHeight": 96, "labels": { "READY": "<rótulo EI>", "NOT_READY": "<rótulo EI>" }, "threshold": { "READY": 0.85, "NOT_READY": 0.85 }, "modelHash": "<sha256>", "files": ["edge-impulse-standalone.js", "edge-impulse-standalone.wasm"] }` + os arquivos em `public/model/` | limiar fixo no código - o §16 exige que venha do `ModelVersion`; limiar escalar - não expressa o limiar assimétrico que o §45 já prevê, e mudar o formato depois é migração de `Analysis` |
| 5. Dados só no dispositivo | toda página é estática (prerender) e todo dado vem de Client Components; nenhuma Server Action nem fetch de servidor no caminho da avaliação | Server Components buscando dados - num reload sem rede o HTML vem do cache do SW mas o dado do servidor não existe, e a doc do Next confirma que `useOffline` só cobre navegação suave |
| 6. Conectividade | `useOffline()` de `next/offline` com `experimental.useOffline: true` em `next.config.ts` | `navigator.onLine` - reporta online num Wi-Fi sem saída para a internet, situação comum na sede da fazenda |
| 7. Ferramental de teste | Vitest (unidade: política de decisão, processador de imagem com `Classifier` falso) + Playwright em Chromium (E2E: `context.setOffline(true)`, câmera via `--use-fake-device-for-media-stream`) | Jest - exige transformação extra para ESM/TS; Cypress - não oferece câmera falsa nem offline do service worker sem plugins |

- Nothing else in this change is hard to reverse

## Criteria

### S1: App instalável que abre sem internet (P1)

Depois de uma abertura online, o app abre e navega sem rede.

**Acceptance Criteria**

1. The system SHALL servir um web manifest com `name` igual ao nome do produto, `display` `standalone`, `start_url` `/` e ícones de 192 e 512 px
2. WHEN o service worker termina de instalar THEN the system SHALL ter em Cache Storage `/`, `/analisar`, `model/manifest.json`, `edge-impulse-standalone.js` e `edge-impulse-standalone.wasm`
3. WHILE o dispositivo está offline, WHEN o usuário recarrega `/` ou `/analisar` THEN the system SHALL renderizar a tela completa a partir do cache
4. WHILE o dispositivo está offline the system SHALL mostrar na Home e na câmera o chip "Offline" com ícone de nuvem cortada em cinza neutro (`#68736D`), nunca em vermelho
5. WHILE o dispositivo está online the system SHALL mostrar na Home e na câmera o chip "● Online" em verde suave (`#EAF5EF` com texto `#1F6B45`)
6. The system SHALL mostrar na Home a linha "IA disponível offline" com `Modelo v<version>` lido de `model/manifest.json`
7. The system SHALL mostrar na Home uma barra inferior com a aba Home e o botão central "Analisar" de 62 px de diâmetro
8. WHEN o usuário toca no botão central "Analisar" THEN the system SHALL abrir `/analisar` direto na câmera
9. WHILE o usuário está na câmera, revisão, análise ou resultado the system SHALL ocultar a barra inferior

**Independent test:** abrir o app online uma vez, ligar o modo avião, recarregar e navegar de `/` até a câmera.

### S2: Capturar e revisar a foto (P1)

O usuário chega a uma foto que ele confirmou ser boa para análise.

**Acceptance Criteria**

10. WHEN o usuário toca "Tirar foto" na Home ou o botão central THEN the system SHALL mostrar a câmera com a moldura de enquadramento e as quatro dicas "Fotografe de lado", "Boa iluminação", "Só um animal" e "Corpo inteiro"
11. The system SHALL posicionar Galeria, Disparo (88 px) e Dicas no terço inferior da câmera, e "Cancelar" no topo
12. WHEN o usuário toca "Escolher da galeria" na Home ou "Galeria" na câmera THEN the system SHALL abrir o seletor de arquivos restrito a `image/*` e, ao escolher, ir para a revisão
13. IF a permissão de câmera é negada ou não existe câmera THEN the system SHALL mostrar "Câmera indisponível" com o botão "Escolher da galeria", sem sair do fluxo
14. WHEN uma foto é tirada ou escolhida THEN the system SHALL mostrar a revisão com a foto ocupando cerca de dois terços da tela, a pergunta "Esta foto está boa para análise?", "Analisar imagem" como ação primária, "Tirar outra foto" como secundária e o texto "A análise é realizada no seu dispositivo."
15. WHILE o dispositivo está offline the system SHALL mostrar na revisão "Sem internet — a análise continuará normalmente."
16. WHEN o usuário toca "Tirar outra foto" THEN the system SHALL descartar a foto e voltar para a câmera
17. WHEN o usuário toca "Cancelar" na câmera THEN the system SHALL voltar para a tela de onde o fluxo começou

**Independent test:** com câmera falsa, tirar a foto, ver a revisão, tirar outra, escolher da galeria e ver a revisão de novo.

### S3: Classificar localmente e ver o resultado (P1)

A foto vira uma decisão com confiança, calculada no aparelho.

**Acceptance Criteria**

18. WHEN o usuário toca "Analisar imagem" THEN the system SHALL mostrar a tela "Analisando" com animação indeterminada e nenhum número de porcentagem
19. IF o modelo ainda está inicializando quando a análise é pedida THEN the system SHALL mostrar "Carregando modelo..." com "Só na primeira abertura." até ele ficar pronto, e então seguir para a análise
20. The system SHALL redimensionar a imagem para `inputWidth × inputHeight` do `model/manifest.json` antes de classificá-la
21. WHEN a probabilidade READY é maior ou igual ao limiar READY do manifesto THEN the system SHALL decidir `READY` (0.85 com limiar 0.85 decide `READY`)
22. WHEN a probabilidade NOT_READY é maior ou igual ao limiar NOT_READY do manifesto THEN the system SHALL decidir `NOT_READY`
23. IF nenhuma probabilidade alcança o limiar da sua classe THEN the system SHALL decidir `INCONCLUSIVE` (READY 0.62 / NOT_READY 0.38 com limiar 0.85)
24. The system SHALL ler os limiares do manifesto, de forma que um manifesto com limiar READY 0.90 decide `INCONCLUSIVE` para READY 0.88
25. The system SHALL exibir como confiança a maior das duas probabilidades truncada para porcentagem inteira (0.914 → "91% de confiança"; 0.849 → "84%")
26. WHEN a decisão é `READY` THEN the system SHALL mostrar o bloco verde `#18864B` com ícone ✓ em círculo e o texto "PRONTO PARA ABATE"
27. WHEN a decisão é `NOT_READY` THEN the system SHALL mostrar o bloco terracota `#C74A3A` com ícone ✕ em círculo e o texto "NÃO PRONTO PARA ABATE"
28. WHEN a decisão é `INCONCLUSIVE` THEN the system SHALL mostrar o bloco âmbar `#E8A93A` com ícone ? em círculo, o texto "RESULTADO INCONCLUSIVO" e a mensagem "A IA não conseguiu determinar o resultado com confiança suficiente. Uma nova foto costuma resolver."
29. WHEN a decisão é `INCONCLUSIVE` THEN the system SHALL mostrar a barra de confiança com uma marca no limiar rotulada "mínimo 85%" (o valor vem do manifesto), as quatro orientações do §40 e "Tirar outra foto" como ação primária
30. The system SHALL mostrar em todo resultado a foto analisada, o modelo (`CattleClassifier v1.4.0`), a data e hora, a ação primária "Nova avaliação" e o aviso fixo "Este resultado é uma estimativa gerada pelo modelo de IA."
31. The system SHALL nunca exibir as palavras "autorizado" ou "aprovado" em nenhuma tela do fluxo
32. IF o modelo falha ao carregar THEN the system SHALL mostrar "Erro ao carregar o modelo", "Reinicie o app. Se persistir, reinstale o modelo com internet." e o botão "Tentar novamente"
33. IF a imagem não pode ser decodificada THEN the system SHALL mostrar "Não foi possível processar esta imagem", "Tente outra foto." e o botão "Tirar outra foto"
34. WHILE o dispositivo está offline, WHEN o usuário toca "Analisar imagem" THEN the system SHALL mostrar um resultado
35. WHEN um resultado é exibido THEN the system SHALL registrar uma `performance.measure` chamada `analise` do toque em "Analisar imagem" até a renderização do resultado
36. WHEN o modelo empacotado classifica as imagens de referência do projeto THEN the system SHALL devolver duas probabilidades entre 0 e 1 cuja soma fica entre 0.99 e 1.01
37. The system SHALL dar a todo controle tocável do fluxo uma área de toque de pelo menos 44 × 44 px

**Independent test:** em modo avião, fotografar uma imagem de referência e ver o resultado com confiança, modelo e aviso.

## Out of scope

| Excluded | Why |
| --- | --- |
| Salvar a avaliação, "Salvar mesmo assim", Histórico, aviso de uso na 1ª análise, `navigator.storage.persist()` | F2 `registro-avaliacoes` - exige IndexedDB, que esta feature não introduz |
| Abas Histórico, Animais e Ajustes na barra | entram com as features que constroem essas telas (F2, F3, F6) |
| Vincular animal na revisão, "Analisar este animal", snapshot | F4 `vinculo-animal` - depende do cadastro (F3) |
| Banner offline com nº de pendentes, status de sincronização no resultado | F5 `sincronizacao` - não existe nada pendente sem persistência |
| Download e troca de versão do modelo, tela Configurações | F6 `atualizacao-modelo` - o modelo desta feature vem empacotado no build |
| Quality check da imagem ("Nenhum bovino encontrado") | P2 no PRD (§41) |

## Assumptions

| Assumption | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Nome do produto (decisão aberta 1 do PRD) | "AgroVision" no manifest e no cabeçalho | é o nome do PRD; trocar é editar duas strings, a identidade da PWA é o `id: "/"` | n |
| Etapas do fluxo de avaliação | uma rota `/analisar` com as etapas em memória; recarregar no meio do fluxo volta para a câmera | a foto não é persistida na F1, então não há o que restaurar | n |
| Rótulo "Câmera indisponível" | texto do critério 13 | o PRD não cobre permissão negada | n |
| Navegador-alvo | Chrome Android atual é o alvo dos testes; Safari iOS não é bloqueante | §35 fala em "Android intermediário"; o Playwright cobre Chromium | n |
| Tamanho de entrada do modelo no manifesto | `96 × 96` só como valor de exemplo | o valor real vem do export do Edge Impulse | n |

**Open questions:** três seguem abertas.

| # | Kind | Question | Until answered |
| --- | --- | --- | --- |
| 1 | blocks | O export WebAssembly do Edge Impulse (`edge-impulse-standalone.js` + `.wasm`) e algumas imagens de referência já existem? | o critério 36 não pode ser provado e o PoC não mede os 3 s; os critérios 20-30 seguem provados com um `Classifier` falso |
| 2 | open | Qual o modo de resize do impulso (squash, fit shortest com crop central, fit longest) e o formato de pixel que `classify()` espera? A doc pública só mostra `classify(rawData)` sem o empacotamento | o critério 20 fica no tamanho; o crop segue o exemplo `run-impulse.js` do próprio export |
| 3 | open | O arquivo de mockups `Gado Certo - Telas.dc.html` não está no repositório | espaçamento e composição seguem os desenhos ASCII do PRD; nenhuma fonte visual é tratada como vinculante |

## Observable

| Surface | Decision | Landing |
| --- | --- | --- |
| screen Home | empty state | n/a - a Home da F1 não lista dados; o resumo numérico é da F4 |
| screen Home | loading state | n/a - página estática, nada a carregar além do shell |
| screen Home | error state | n/a - não há fetch; erro de modelo aparece na análise (AC 32) |
| screen Home | unauthorised state | n/a - o MVP não tem contas nem login |
| screen Home | density and ordering | AC 6, AC 7 |
| screen câmera | loading state | n/a - moldura e dicas renderizam na hora; o vídeo aparece quando o stream inicia |
| screen câmera | error / unauthorised (permissão negada) | AC 13 |
| screen câmera | destructive action confirms | n/a - "Cancelar" descarta uma foto que nunca foi salva |
| screen câmera | density and ordering | AC 10, AC 11 |
| screen revisão | error state | AC 33 |
| screen revisão | destructive action confirms | n/a - "Tirar outra foto" descarta uma foto que nunca foi salva |
| screen revisão | offline state | AC 15 |
| screen analisando | loading state | AC 18, AC 19 |
| screen analisando | error state | AC 32 |
| screen resultado | states | AC 26, AC 27, AC 28, AC 29 |
| screen resultado | error state | n/a - a tela só é alcançada com uma decisão calculada |
| screen resultado | destructive action confirms | n/a - nada é salvo nesta feature, logo nada é excluído |
| copy do resultado | tom e próximo passo | AC 28, AC 30 |
| copy do resultado | vocabulário proibido | AC 31 |
| web manifest | identidade da instalação | AC 1 |

## Sources

- `PRD v1.1.md` - §7, §8, §13-17, §23, §33, §40, §42, §50 (Fase 1), §53, §55
- Next.js 16.3.6 `node_modules/next/dist/docs` - `progressive-web-apps.md`, `offline-support.md`, `use-offline.md`
- Serwist, `@serwist/turbopack` - https://serwist.pages.dev/docs/next/turbo
