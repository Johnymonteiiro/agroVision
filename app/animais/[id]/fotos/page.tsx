import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Icon } from "@/modules/core/ui/icon";
import { ReadinessBadge } from "@/modules/animals/components/readiness-badge";
import { POSITION_LABEL, POSITION_OPTIONS, POSITION_SLUG } from "@/modules/vision/positions";
import { animalTitle } from "@/modules/animals/format";
import { photoCountLabel } from "@/modules/core/format/count";
import { findAnimal, listImages } from "@/modules/animals/server/repo";

export default async function EscolherPosicaoPage({ params }: PageProps<"/animais/[id]/fotos">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const animal = await findAnimal(id);
  if (!animal) notFound();
  const images = await listImages(id);

  return (
    <main className="mx-auto w-full max-w-[480px] px-4 pb-10">
      <header className="flex items-center gap-2 pt-3">
        <Link href={`/animais/${id}`} aria-label="Voltar" className="-ml-1 flex size-11 items-center justify-center">
          <Icon name="arrow_back" />
        </Link>
        <span className="text-[15px] font-medium text-muted">{animalTitle(animal.externalId)}</span>
      </header>
      <h1 className="mt-3 text-[28px] font-bold leading-[1.1] tracking-[-0.02em]">Qual posição?</h1>
      <p className="mt-1.5 text-[16px] text-muted">Escolha antes de abrir a câmera. Cada posição aceita várias fotos.</p>

      <div
        className="mt-4 flex items-center justify-between rounded-[12px] bg-white pl-3.5 shadow-[0_0_0_1px_rgba(0,0,0,.06)]"
        data-testid="capture-readiness"
      >
        <span className="flex flex-wrap items-center gap-2 text-[14px] text-ink-2">
          As fotos serão salvas como
          <ReadinessBadge readiness={animal.readiness} />
        </span>
        <Link
          href={`/animais/${id}/rotulo?de=/animais/${id}/fotos`}
          className="flex h-11 shrink-0 items-center px-3.5 text-[15px] font-semibold text-primary"
        >
          Alterar
        </Link>
      </div>

      <ul className="mt-5 flex flex-col gap-2.5">
        {POSITION_OPTIONS.map((o) => {
          const n = images.filter((img) => img.position === o.position).length;
          return (
            <li key={o.position}>
              <Link
                href={`/animais/${id}/fotos/${POSITION_SLUG[o.position]}`}
                data-primary-action
                className="flex h-[60px] items-center gap-3 rounded-btn border-[1.5px] border-line bg-white px-4"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Icon name={o.icon} size={22} />
                </span>
                <span className="flex-1">
                  <span className="block text-[17px] font-semibold">{POSITION_LABEL[o.position]}</span>
                  <span className="block text-[13px] text-muted">{o.hint}</span>
                </span>
                <span className="text-[13px] font-medium text-muted">{photoCountLabel(n)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
