import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Icon } from "@/components/icon";
import { POSITION_LABEL, POSITION_SLUG, animalTitle, photoCountLabel } from "@/lib/animals/format";
import { findAnimal, listImages } from "@/lib/animals/repo";

const OPTIONS = [
  { position: "REAR", icon: "u_turn_left", hint: "Traseira do animal, centralizada" },
  { position: "TOP", icon: "vertical_align_bottom", hint: "Dorso visto de cima" },
  { position: "SIDE", icon: "swap_horiz", hint: "Corpo inteiro, de lado" },
] as const;

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

      <ul className="mt-5 flex flex-col gap-2.5">
        {OPTIONS.map((o) => {
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
