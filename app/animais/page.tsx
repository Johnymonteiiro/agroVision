import Link from "next/link";
import { connection } from "next/server";
import { Icon } from "@/components/icon";
import { animalSummary, formatWhen } from "@/lib/animals/format";
import { listAnimals } from "@/lib/animals/repo";
import { AnimalsList, type AnimalRow } from "./animals-list";

export default async function AnimaisPage() {
  await connection();
  const animals = await listAnimals();
  const rows: AnimalRow[] = animals.map((a) => {
    const summary = animalSummary(a);
    return {
      id: a.id,
      externalId: a.externalId,
      category: a.category,
      sex: a.sex,
      title: summary.title,
      line1: summary.line1,
      line2: summary.line2,
      photoCount: a.photoCount,
      lastPhoto: a.lastPhotoAt ? formatWhen(a.lastPhotoAt) : null,
      thumbUrl: a.mainPhotoId ? `/api/images/${a.mainPhotoId}?variant=thumb` : null,
    };
  });

  return (
    <main className="mx-auto w-full max-w-[480px] pb-10">
      <header className="flex items-end justify-between px-5 pt-6">
        <div>
          <h1 className="text-[28px] font-bold leading-[1.1] tracking-[-0.02em]">Animais</h1>
          <p className="mt-1 text-[14px] text-muted">{rows.length} cadastrados</p>
        </div>
        <Link
          href="/animais/novo"
          className="flex h-11 items-center gap-1.5 rounded-[12px] bg-primary pl-2.5 pr-3.5 text-[15px] font-semibold text-white"
        >
          <Icon name="add" size={22} />
          Adicionar animal
        </Link>
      </header>

      {rows.length === 0 ? (
        <section className="mx-4 mt-6 flex flex-col items-center rounded-card-lg bg-white px-5 py-6 text-center shadow-[0_0_0_1px_rgba(0,0,0,.06)]">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Icon name="sell" size={30} />
          </div>
          <p className="mt-3.5 text-[17px] font-semibold">Nenhum animal cadastrado</p>
          <p className="mt-1 text-[14px] leading-[1.4] text-muted">Os animais cadastrados aparecerão aqui.</p>
          <Link
            href="/animais/novo"
            className="mt-4 flex h-12 items-center gap-2 rounded-[12px] bg-primary px-[18px] text-[15px] font-semibold text-white"
          >
            <Icon name="add" size={20} />
            Adicionar animal
          </Link>
        </section>
      ) : (
        <AnimalsList rows={rows} />
      )}
    </main>
  );
}
