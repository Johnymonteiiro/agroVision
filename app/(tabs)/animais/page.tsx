import Link from "next/link";
import { connection } from "next/server";
import { Icon } from "@/modules/core/ui/icon";
import { InstallBanner } from "@/modules/core/ui/install-banner";
import { animalsTabFilters } from "@/modules/animals/filters";
import { listAnimals } from "@/modules/animals/server/repo";
import { listCategories } from "@/modules/categories/server/repo";
import { AnimalsList } from "@/modules/animals/components/animals-list";
import { toAnimalRows } from "@/modules/animals/to-rows";

// Aba Animais: só lista. O cadastro fica na aba Dataset (dataset-rotulos).
export default async function AnimaisPage() {
  await connection();
  const [animals, categories] = await Promise.all([listAnimals(), listCategories()]);
  const rows = toAnimalRows(animals);

  return (
    <main className="mx-auto w-full max-w-[480px] pb-10">
      <header className="px-5 pt-6">
        <h1 className="text-[28px] font-bold leading-[1.1] tracking-[-0.02em]">Animais</h1>
        <p className="mt-1 text-[14px] text-muted">{rows.length} cadastrados</p>
      </header>

      <InstallBanner />

      {rows.length === 0 ? (
        <section className="mx-4 mt-6 flex flex-col items-center rounded-card-lg bg-white px-5 py-6 text-center shadow-[0_0_0_1px_rgba(0,0,0,.06)]">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Icon name="sell" size={30} />
          </div>
          <p className="mt-3.5 text-[17px] font-semibold">Nenhum animal cadastrado</p>
          <p className="mt-1 text-[14px] leading-[1.4] text-muted">Cadastre animais na aba Dataset.</p>
          <Link
            href="/dataset"
            className="mt-4 flex h-12 items-center gap-2 rounded-[12px] bg-primary-soft px-[18px] text-[15px] font-semibold text-primary-dark"
          >
            <Icon name="dataset" size={20} />
            Ir para Dataset
          </Link>
        </section>
      ) : (
        <AnimalsList rows={rows} filters={animalsTabFilters(categories)} />
      )}
    </main>
  );
}
