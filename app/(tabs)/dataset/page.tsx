import { connection } from "next/server";
import { datasetFilters } from "@/modules/animals/filters";
import { animalCountLabel } from "@/modules/animals/format";
import { photoCountLabel } from "@/modules/core/format/count";
import { datasetPhotoCounts } from "@/modules/dataset/server/repo";
import { listAnimals } from "@/modules/animals/server/repo";
import { listCategories } from "@/modules/categories/server/repo";
import { buildDatasetSummary } from "@/modules/dataset/summary";
import { AnimalsList } from "@/modules/animals/components/animals-list";
import { toAnimalRows } from "@/modules/animals/to-rows";
import { NewEntryMenu } from "@/modules/dataset/components/new-entry-menu";

const CARD = "rounded-card bg-white shadow-[0_1px_2px_rgba(23,33,28,.04),0_4px_16px_rgba(23,33,28,.04)]";
const SECTION_TITLE = "text-[17px] font-bold";

// Aba Dataset: "Novo cadastro" (animal ou categoria), resumo por rótulo de captura × categoria e a lista com filtros.
export default async function DatasetPage() {
  await connection();
  const [animals, categories, counts] = await Promise.all([listAnimals(), listCategories(), datasetPhotoCounts()]);
  const summary = buildDatasetSummary(counts, categories);
  const rows = toAnimalRows(animals);

  return (
    <main className="mx-auto w-full max-w-[480px] pb-10">
      <header className="flex items-start justify-between gap-3 px-5 pt-6">
        <div>
          <h1 className="text-[28px] font-bold leading-[1.1] tracking-[-0.02em]">Dataset</h1>
          <p className="mt-1 text-[14px] text-muted" data-testid="dataset-totals">
            {animalCountLabel(rows.length)} · {photoCountLabel(summary.total)}
          </p>
        </div>
        <NewEntryMenu />
      </header>

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
