# Project state

## Decisions

| ID | Decision | Rationale | Status | Date |
| --- | --- | --- | --- | --- |
| AD-001 | O rótulo do dataset é `READY` / `NOT_READY` (enum `readiness`), gravado em cada foto no upload (`animal_images.readiness_at_capture`); quem exporta ou treina lê esse campo, nunca o rótulo atual do animal | o animal muda de estado com o tempo; o vocabulário é o mesmo do modelo (PRD §30) e de `Decision` (F4b) | active | 2026-11-22 |
| AD-002 | Categoria é a tabela `categories`, com nome único sem diferença de caixa e espaços; não é renomeada nem excluída até haver uma regra para as fotos já tiradas | um nome que muda ou some altera o grupo de fotos já coletadas | active | 2026-11-22 |
| AD-003 | A chave do objeto no MinIO não carrega rótulo nem categoria (`animals/{animalId}/{position}/{imageId}.jpg`); a organização por rótulo e categoria sai do banco na exportação | corrigir um rótulo nunca obriga a mover objetos | active | 2026-11-22 |

## Handoff

**Feature**: dataset-rotulos
**Where**: plan.md e checks.md escritos e validados; aguardando aprovação dos checks antes do build
**In progress**: nenhum código alterado
**Next step**: com os checks aprovados, resetar os volumes do Docker (com confirmação), gerar a migração 0001 e começar pelo S1
**Blockers**: none
**Uncommitted**: none
**Branch**: feat/dataset-rotulos
