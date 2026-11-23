# Roadmap

Mapa de features derivado do `PRD v1.1.md` e da decisão de 2026-10-04: **o dataset vem antes do
classificador**. Primeiro o projeto coleta fotos rotuladas de bovinos; o modelo é treinado com
elas e só então a avaliação Pronto / Não pronto entra. Cada feature ganha seu
`.specs/features/<feature>/plan.md` quando a anterior for aprovada.

Stack: Next.js 16, PostgreSQL, MinIO, sharp, Docker Compose.

| # | Feature | Resultado observável | Fonte | Depende de | Status |
| --- | --- | --- | --- | --- | --- |
| F1 | `cadastro-animal` | cadastrar o animal (categoria, identificação, idade, peso, sexo) e fotografá-lo por posição (de trás, de cima, lateral) com distância mínima e guia de enquadramento; fotos comprimidas no MinIO | pedido de 2026-10-04; PRD §9-11, §27 | - | entregue (PR #1) |
| F1b | `dataset-rotulos` | todo animal tem categoria (lista cadastrável, Taurino e Zebu de início) e rótulo Pronto / Não pronto; cada foto grava o rótulo da captura; aba Dataset com cadastro, categorias, resumo por rótulo × categoria e lista com filtros; a aba Animais só lista; Ajustes sai da barra | pedido de 2026-11-22; PRD §29-30, §46 | F1 | plano e checks escritos |
| R1 | `estrutura-modular` | o código em `modules/` por domínio (visão computacional em `vision`, modelo em `model`), `app/` só com rotas, fronteiras fiscalizadas pelo lint; nada muda para o usuário | pedido de 2026-11-22 | F1b | construída; testes e Verifier aguardando autorização |
| F1c | `qualidade-imagem` | aviso de foto desfocada, escura/clara demais, sem bovino ou com mais de um animal, na revisão do dataset e da avaliação; métricas gravadas por foto | PRD §41, §42; escolha do usuário em 2026-11-22 | R1 | - |
| F2 | `edicao-animal` | editar e excluir animal, excluir foto, "+ Pesar" com histórico de peso | PRD §11, §20, §28, FR-007, FR-019 | F1 | - |
| F3 | `exportacao-dataset` | exportar as fotos em `<READY ou NOT_READY>/<categoria>/<posição>` (rótulo de `readiness_at_capture`, categoria do animal), com manifesto e download, separando treino e teste por animal | PRD §46, §47 | F1b | - |
| F4 | `fila-offline` | cadastrar e fotografar sem internet; envio automático quando a rede voltar | PRD §21-26 | F1 | - |
| F4b | `fluxo-avaliacao` | o app abre na Home; captura, revisão, análise e as telas Pronto / Não pronto / Inconclusivo, com o classificador atrás de uma porta e "Modelo de IA ainda não disponível" enquanto não há modelo | design 1a-1h; PRD §7-8, §13-17, §40 | F1 | construída, em verificação |
| F5 | `avaliacao-offline` | adaptador Edge Impulse, pacote do modelo e service worker: a avaliação real roda no aparelho, também sem rede (a interface veio da F4b) | PRD §21-26, §50 Fase 1 | modelo treinado com o dataset; F4b | plano escrito, **parado** |
| F6 | `registro-avaliacoes` | salvar avaliações, Histórico, detalhes, resultado confirmado | PRD §18-19, §29, §47 | F5 | - |
| F7 | `vinculo-animal` | analisar um animal cadastrado e vincular depois | PRD §12, §14 | F5, F6 | - |
| F8 | `atualizacao-modelo` | baixar, validar e ativar nova versão do modelo | PRD §32 | F5 | - |

P2 do PRD (§41 quality check, dashboard, gráfico de evolução, balança, layout tablet) fica fora
até o MVP fechar.
