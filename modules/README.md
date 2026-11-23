# Módulos

Cada domínio do app vive numa pasta de `modules/`. `app/` só tem as rotas do Next (`page`, `layout`,
`loading`, `route`) e importa o que precisar daqui. A decisão está em
`.specs/features/estrutura-modular/plan.md` e em `.specs/STATE.md` (AD-004).

## Convenções

- **Sem `index.ts`**: importe pelo caminho do arquivo (`@/modules/vision/detection/framing`). Um
  arquivo que reexportasse client e server levaria `pg` e `sharp` para o navegador.
- **`components/`**: componentes React do módulo (client ou server).
- **`server/`**: código que só roda no servidor (banco, MinIO, `sharp`). Todo arquivo começa com
  `import "server-only";`, e o build do Next falha se um componente client o importar.
  `core/db/client.ts`, `core/db/migrate.ts` e `core/storage/object-store.ts` seguem a mesma regra;
  `core/db/schema.ts` não, porque o drizzle-kit o carrega fora do Next.
- **Dentro do módulo**, use import relativo ou o alias. **Entre módulos**, use o alias e respeite
  a tabela abaixo: o `pnpm lint` (`no-restricted-imports`, em `eslint.config.mjs`) barra o resto.

## Módulos e dependências

| Módulo | O que tem | Pode importar |
| --- | --- | --- |
| `core` | banco (`db`), MinIO (`storage`), hooks, UI base (ícone, barra, chip de conexão), formatação, validação, `safeOrigin` | nenhum módulo |
| `vision` | **visão computacional**: detector MediaPipe (`detection`), enquadramento, retângulo-guia e distância mínima (`geometry`), posições de foto, câmera guiada com revisão (`camera`) e, a seguir, a checagem de qualidade (`quality`) | `core` |
| `model` | **modelo de IA**: porta do classificador (`loadClassifier`, `ModelUnavailableError`, gancho `__agroClassifier`), política de decisão por limiar, status do modelo. O adaptador Edge Impulse (F5) entra aqui | `core` |
| `categories` | categorias cadastráveis: seed, validação, repositório, formulário | `core` |
| `animals` | animal: idade, resumo, validação, filtros, repositório, rótulo (selo, cartões, tela "Alterar rótulo"), lista | `core` |
| `photos` | fotos do dataset: foto principal, envio, processamento com `sharp`, upload para o MinIO, captura por posição | `core`, `vision`, `animals` |
| `evaluation` | fluxo de avaliação: foto pendente da galeria, data do resultado, telas do fluxo e do resultado | `core`, `vision`, `model` |
| `dataset` | coleta: cadastro de animal com foto, resumo por rótulo × categoria; a exportação (F3) entra aqui | `core`, `vision`, `animals`, `categories`, `photos` |
