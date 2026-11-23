import Link from "next/link";
import { connection } from "next/server";
import { Icon } from "@/modules/core/ui/icon";
import { datasetFilters } from "@/modules/animals/filters";
import { animalCountLabel } from "@/modules/animals/format";
import { photoCountLabel } from "@/modules/core/format/count";
import { datasetPhotoCounts } from "@/modules/dataset/server/repo";
import { listAnimals } from "@/modules/animals/server/repo";
import { listCategories } from "@/modules/categories/server/repo";
import { buildDatasetSummary } from "@/modules/dataset/summary";
import { AnimalsList } from "@/modules/animals/components/animals-list";
import { toAnimalRows } from "@/modules/animals/to-rows";

const CARD = "rounded-card bg-white shadow-[0_1px_2px_rgba(23,33,28,.04),0_4px_16px_rgba(23,33,28,.04)]";
const SECTION_TITLE = "text-[17px] font-bold";

// Aba Dataset: cadastro de animais e categorias, resumo por rótulo de captura × categoria e a lista com filtros.
export default async function DatasetPage() {
  await connection();
  const [animals, categories, counts] = await Promise.all([listAnimals(), listCategories(), datasetPhotoCounts()]);
  const summary = buildDatasetSummary(counts, categories);
  const rows = toAnimalRows(animals);

  return (
    <main className="mx-auto w-full max-w-[480px] pb-10">
      <header className="px-5 pt-6">
        <h1 className="text-[28px] font-bold leading-[1.1] tracking-[-0.02em]">Dataset</h1>
        <p className="mt-1 text-[14px] text-muted" data-testid="dataset-totals">
          {animalCountLabel(rows.length)} · {photoCountLabel(summary.total)}
        </p>
      </header>

      <div className="px-4 pt-4">
        <Link
          href="/dataset/novo"
          data-primary-action
          className="flex h-[58px] items-center justify-center gap-2.5 rounded-btn bg-primary text-[18px] font-semibold text-white"
        >
          <Icon name="add" />
          Cadastrar animal
        </Link>
      </div>

      <section className="mt-6" data-testid="section-summary">
        <h2 className={`px-5 pb-2 ${SECTION_TITLE}`}>Resumo</h2>
        {summary.total === 0 ? (
          <p className={`mx-4 p-4 text-[15px] text-muted ${CARD}`}>Nenhuma foto ainda</p>
        ) : (
          <div className="mx-4 grid grid-cols-2 gap-2.5">
            {(["READY", "NOT_READY"] as const).map((r) => {
              const group = summary.groups[r];
              return (
                <div key={r} className={`p-3.5 ${CARD}`} data-testid={`summary-${r}`}>
                  <p className={`text-[13px] font-bold ${r === "READY" ? "text-ready" : "text-not-ready"}`} data-testid="summary-title">
                    {r === "READY" ? "PRONTO" : "NÃO PRONTO"}
                  </p>
                  <p className="mt-1 text-[22px] font-bold leading-tight" data-testid="summary-total">
                    {photoCountLabel(group.total)}
                  </p>
                  <p className="mt-1 text-[13px] leading-snug text-muted" data-testid="summary-parts">
                    {group.parts.map((p) => `${p.name} ${p.count}`).join(" · ")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-6" data-testid="section-categories">
        <div className="flex items-center justify-between px-5 pb-1">
          <h2 className={SECTION_TITLE}>Categorias</h2>
          <Link
            href="/dataset/categorias/nova"
            className="flex h-11 items-center rounded-[12px] bg-primary-soft px-3.5 text-[15px] font-semibold text-primary-dark"
          >
            + Nova
          </Link>
        </div>
        <ul className={`mx-4 ${CARD}`}>
          {categories.map((c) => (
            <li
              key={c.id}
              data-testid="category-item"
              className="flex min-h-[52px] items-center justify-between gap-3 border-b border-line-soft px-4 py-2.5 last:border-b-0"
            >
              <span className="min-w-0 text-[15px]">
                <span className="font-semibold">{c.name}</span>
                {c.description && <span className="text-muted"> · {c.description}</span>}
              </span>
              <span className="shrink-0 text-[13px] font-medium text-muted">{animalCountLabel(c.animalCount)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6" data-testid="section-animals">
        <h2 className={`px-5 ${SECTION_TITLE}`}>Animais</h2>
        {rows.length === 0 ? (
          <p className={`mx-4 mt-2 p-4 text-[15px] text-muted ${CARD}`}>Nenhum animal cadastrado</p>
        ) : (
          <AnimalsList rows={rows} filters={datasetFilters(categories)} />
        )}
      </section>
    </main>
  );
}
