# Roadmap

Mapa de features derivado do `PRD v1.1.md` e da decisão de 2026-10-04: **o dataset vem antes do
classificador**. Primeiro o projeto coleta fotos rotuladas de bovinos; o modelo é treinado com
elas e só então a avaliação Pronto / Não pronto entra. Cada feature ganha seu
`.specs/features/<feature>/plan.md` quando a anterior for aprovada.

Stack: Next.js 16, PostgreSQL, MinIO, sharp, Docker Compose.

| # | Feature | Resultado observável | Fonte | Depende de | Status |
| --- | --- | --- | --- | --- | --- |
| F1 | `cadastro-animal` | cadastrar o animal (categoria, identificação, idade, peso, sexo) e fotografá-lo por posição (de trás, de cima, lateral) com distância mínima e guia de enquadramento; fotos comprimidas no MinIO | pedido de 2026-10-04; PRD §9-11, §27 | - | plano em revisão |
| F2 | `edicao-animal` | editar e excluir animal, excluir foto, "+ Pesar" com histórico de peso | PRD §11, §20, §28, FR-007, FR-019 | F1 | - |
| F3 | `exportacao-dataset` | exportar as fotos com os rótulos (manifesto + download) separando treino e teste por animal | PRD §46, §47 | F1 | - |
| F4 | `fila-offline` | cadastrar e fotografar sem internet; envio automático quando a rede voltar | PRD §21-26 | F1 | - |
| F5 | `avaliacao-offline` | instalar a PWA e classificar Pronto / Não pronto / Inconclusivo no aparelho | PRD §7-8, §13-17, §50 Fase 1 | modelo treinado com o dataset | plano escrito, **parado** |
| F6 | `registro-avaliacoes` | salvar avaliações, Histórico, detalhes, resultado confirmado | PRD §18-19, §29, §47 | F5 | - |
| F7 | `vinculo-animal` | analisar um animal cadastrado e vincular depois | PRD §12, §14 | F5, F6 | - |
| F8 | `atualizacao-modelo` | baixar, validar e ativar nova versão do modelo | PRD §32 | F5 | - |

P2 do PRD (§41 quality check, dashboard, gráfico de evolução, balança, layout tablet) fica fora
até o MVP fechar.
