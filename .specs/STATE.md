# Project state

## Decisions

| ID | Decision | Rationale | Status | Date |
| --- | --- | --- | --- | --- |
| AD-001 | O rótulo do dataset é `READY` / `NOT_READY` (enum `readiness`), gravado em cada foto no upload (`animal_images.readiness_at_capture`); quem exporta ou treina lê esse campo, nunca o rótulo atual do animal | o animal muda de estado com o tempo; o vocabulário é o mesmo do modelo (PRD §30) e de `Decision` (F4b) | active | 2026-11-22 |
| AD-002 | Categoria é a tabela `categories`, com nome único sem diferença de caixa e espaços; não é renomeada nem excluída até haver uma regra para as fotos já tiradas | um nome que muda ou some altera o grupo de fotos já coletadas | active | 2026-11-22 |
| AD-003 | A chave do objeto no MinIO não carrega rótulo nem categoria (`animals/{animalId}/{position}/{imageId}.jpg`); a organização por rótulo e categoria sai do banco na exportação | corrigir um rótulo nunca obriga a mover objetos | active | 2026-11-22 |
| AD-004 | O código vive em `modules/<domínio>` (`core`, `vision`, `model`, `evaluation`, `animals`, `categories`, `photos`, `dataset`); `app/` só tem rotas. Cada módulo só importa os da tabela de `modules/README.md`, fiscalizada por `no-restricted-imports` em `eslint.config.mjs`. Código de servidor fica em `server/` com `import "server-only"`. Sem `index.ts` | visão computacional e modelo ganham lugar próprio; o lint impede dependência cruzada e o build impede servidor no bundle do cliente | active | 2026-11-22 |

## Handoff

**Feature**: estrutura-modular
**Where**: código em `febfdf9`; C2, C3 e C14 rodados e verdes; typecheck limpo; smoke no `pnpm dev` com todas as rotas em 200
**In progress**: nada
**Next step**: com autorização do usuário, rodar C1, C4 e C5-C13 (`pnpm vitest run`, `pnpm playwright test`, `pnpm build`) e despachar os Verifiers desta feature e da `dataset-rotulos`. Depois, planejar a checagem de qualidade em `modules/vision/quality`
**Blockers**: autorização para rodar testes
**Uncommitted**: none
**Branch**: refactor/modulos (a partir de `feat/dataset-rotulos`; nada foi enviado ao GitHub)
