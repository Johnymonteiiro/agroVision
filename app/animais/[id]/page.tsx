import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Icon } from "@/components/icon";
import {
  CATEGORY_LABEL,
  POSITION_LABEL,
  POSITION_ORDER,
  POSITION_SLUG,
  SEX_LABEL,
  animalSummary,
  photoCountLabel,
} from "@/lib/animals/format";
import { findAnimal, listImages } from "@/lib/animals/repo";
import { mainPhoto } from "@/lib/photos/main-photo";

export default async function PerfilPage({ params }: PageProps<"/animais/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const animal = await findAnimal(id);
  if (!animal) notFound();

  const images = await listImages(id);
  const hero = mainPhoto(images);
  const summary = animalSummary(animal);

  const grid = [
    ["Categoria", CATEGORY_LABEL[animal.category]],
    ["Sexo", SEX_LABEL[animal.sex]],
    ["Idade", summary.ageShort],
    ["Peso", `${animal.weightKg} kg`],
  ];

  return (
    <main className="mx-auto w-full max-w-[480px] pb-10">
      <div className="relative h-[290px]" data-testid="profile-hero">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/images/${hero.id}?variant=full`} alt="" className="size-full object-cover" />
        ) : (
          <div className="placeholder-stripes flex size-full items-center justify-center text-muted" data-testid="hero-placeholder">
            <Icon name="photo_camera" size={40} />
          </div>
        )}
        <Link
          href="/animais"
          aria-label="Voltar"
          className="absolute left-4 top-4 flex size-11 items-center justify-center rounded-full bg-white/90"
        >
          <Icon name="arrow_back" />
        </Link>
      </div>

      <section
        data-testid="profile-card"
        className="relative mx-3 -mt-10 rounded-card-lg bg-white px-4 pb-4 pt-[18px] shadow-[0_1px_2px_rgba(23,33,28,.04),0_8px_24px_rgba(23,33,28,.06)]"
      >
        <h1 className="text-[26px] font-bold leading-[1.1] tracking-[-0.02em]">{summary.title}</h1>
        <p className="mt-1.5 text-[16px] font-medium text-ink-2">{summary.line1}</p>
        <p className="mt-0.5 text-[16px] text-muted">{summary.line2}</p>
        <dl className="mt-4 grid grid-cols-4 gap-1.5">
          {grid.map(([label, value]) => (
            <div key={label} className="rounded-[12px] bg-bg px-2 py-2.5">
              <dt className="text-[11px] text-muted">{label}</dt>
              <dd className="mt-0.5 text-[14px] font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <Link
          href={`/animais/${animal.id}/fotos`}
          data-primary-action
          className="mt-3.5 flex h-[58px] items-center justify-center gap-2.5 rounded-btn bg-primary text-[18px] font-semibold text-white"
        >
          <Icon name="photo_camera" />
          Fotografar animal
        </Link>
      </section>

      {POSITION_ORDER.map((position) => {
        const photos = images.filter((img) => img.position === position);
        return (
          <section key={position} className="mt-5" data-testid={`position-${position}`}>
            <div className="flex justify-between px-5 pb-2 text-[13px] font-semibold text-muted">
              <span>{POSITION_LABEL[position]}</span>
              <span data-testid="position-count">{photoCountLabel(photos.length)}</span>
            </div>
            <div className="mx-4 rounded-card bg-white p-3 shadow-[0_1px_2px_rgba(23,33,28,.04),0_4px_16px_rgba(23,33,28,.04)]">
              {photos.length === 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[14px] text-muted">Nenhuma foto</span>
                  <Link
                    href={`/animais/${animal.id}/fotos/${POSITION_SLUG[position]}`}
                    className="flex h-11 items-center gap-1.5 rounded-[12px] bg-primary-soft px-3.5 text-[15px] font-semibold text-primary-dark"
                  >
                    <Icon name="add_a_photo" size={20} />
                    Adicionar fotos
                  </Link>
                </div>
              ) : (
                <ul className="grid grid-cols-4 gap-2">
                  {photos.map((img) => (
                    <li key={img.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/images/${img.id}?variant=thumb`}
                        alt=""
                        data-image-id={img.id}
                        className="aspect-square w-full rounded-[10px] object-cover"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })}
    </main>
  );
}
