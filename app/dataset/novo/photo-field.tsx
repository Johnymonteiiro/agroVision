"use client";

import { useRef, useState } from "react";
import { GuidedCamera, type CapturedPhoto } from "@/components/guided-camera";
import { Icon } from "@/components/icon";
import { POSITION_LABEL, POSITION_OPTIONS } from "@/lib/animals/format";
import type { Position } from "@/lib/camera/min-distance";
import type { PhotoToSend } from "@/lib/images/send-photo";

export type FormPhoto = PhotoToSend & { url: string };

type Source = "camera" | "gallery";

type Props = {
  photo: FormPhoto | null;
  onChange: (photo: FormPhoto | null) => void;
  // Peso válido do formulário, para a câmera mostrar a distância mínima; null se ainda não há.
  weightKg: number | null;
  invalid: boolean;
};

// Bloco "Foto do animal" do cadastro (design 2a/2b). A posição é escolhida antes da câmera ou da galeria,
// e a foto só é enviada quando o animal é salvo.
export function PhotoField({ photo, onChange, weightKg, invalid }: Props) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const galleryPosition = useRef<Position | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [cameraPosition, setCameraPosition] = useState<Position | null>(null);
  const [unreadable, setUnreadable] = useState(false);

  function keep(shot: CapturedPhoto, position: Position) {
    setUnreadable(false);
    onChange({ ...shot, position, imageId: crypto.randomUUID(), url: URL.createObjectURL(shot.blob) });
  }

  function choose(position: Position) {
    if (source === "camera") {
      setCameraPosition(position);
    } else {
      // Ainda dentro do toque do usuário, que o navegador exige para abrir o seletor de arquivos.
      galleryPosition.current = position;
      galleryRef.current?.click();
    }
    setSource(null);
  }

  async function fromGallery(file: File | undefined) {
    const position = galleryPosition.current;
    if (!file || !position) return;
    try {
      // createImageBitmap aplica a orientação do EXIF, então largura e altura saem como a foto aparece.
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      bitmap.close();
      // Sem o guia ao vivo, o enquadramento fica UNAVAILABLE para a curadoria poder separar essas fotos.
      keep(
        // lastModified é a data do arquivo; o navegador usa o momento da escolha quando ela não existe.
        { blob: file, framing: "UNAVAILABLE", capturedAt: new Date(file.lastModified).toISOString(), width, height },
        position,
      );
    } catch {
      setUnreadable(true);
    }
  }

  function replace() {
    if (photo) URL.revokeObjectURL(photo.url);
    onChange(null);
  }

  return (
    <>
      {photo ? (
        <div className="relative h-[220px] overflow-hidden rounded-card bg-line-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt={`Foto do animal, ${POSITION_LABEL[photo.position]}`}
            data-testid="photo-preview"
            className="size-full object-cover"
          />
          <span className="absolute left-2.5 top-2.5 flex h-[30px] items-center rounded-full bg-white/92 px-2.5 text-[12px] font-semibold text-ink-2">
            {POSITION_LABEL[photo.position]}
          </span>
          <span className="absolute bottom-2.5 left-2.5 flex h-[30px] items-center gap-1.5 rounded-full bg-white/92 px-2.5 text-[12px] font-semibold text-ready">
            <Icon name="check_circle" size={16} />
            Foto adicionada
          </span>
          <button
            type="button"
            onClick={replace}
            className="absolute bottom-2.5 right-2.5 flex h-11 items-center gap-1.5 rounded-[12px] bg-white/92 px-3.5 text-[14px] font-semibold text-primary-dark"
          >
            <Icon name="replay" size={18} />
            Trocar foto
          </button>
        </div>
      ) : (
        <div
          className={`flex h-[168px] flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed bg-white ${
            invalid || unreadable ? "border-[#C74A3A]" : "border-line"
          }`}
        >
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => setSource("camera")}
              className="flex h-[52px] items-center gap-2 rounded-btn bg-primary px-[18px] text-[16px] font-semibold text-white"
            >
              <Icon name="photo_camera" />
              Tirar foto
            </button>
            <button
              type="button"
              onClick={() => setSource("gallery")}
              className="flex h-[52px] items-center gap-2 rounded-btn bg-primary-soft px-[18px] text-[16px] font-semibold text-primary-dark"
            >
              <Icon name="photo_library" size={22} />
              Galeria
            </button>
          </div>
          <p className="text-[13px] text-muted">
            {unreadable ? "Não foi possível abrir esta imagem. Escolha outra." : "Você escolhe a posição antes da foto"}
          </p>
        </div>
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        data-testid="gallery-input"
        onChange={(e) => {
          void fromGallery(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {source && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40">
          <button type="button" aria-label="Fechar escolha de posição" className="absolute inset-0" onClick={() => setSource(null)} />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="position-title"
            className="relative mx-auto w-full max-w-[480px] rounded-t-[24px] bg-white px-4 pt-5 pb-[max(20px,env(safe-area-inset-bottom))]"
          >
            <h2 id="position-title" className="text-[22px] font-bold leading-[1.25] tracking-[-0.01em]">
              Qual posição?
            </h2>
            <p className="mt-1 text-[15px] text-muted">
              {source === "camera" ? "Escolha antes de abrir a câmera." : "Escolha antes de selecionar a foto."}
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {POSITION_OPTIONS.map((o) => (
                <li key={o.position}>
                  <button
                    type="button"
                    data-primary-action
                    onClick={() => choose(o.position)}
                    className="flex h-[60px] w-full items-center gap-3 rounded-btn border-[1.5px] border-line bg-white px-4 text-left"
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                      <Icon name={o.icon} size={22} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-[17px] font-semibold">{POSITION_LABEL[o.position]}</span>
                      <span className="block text-[13px] text-muted">{o.hint}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setSource(null)}
              className="mt-2 flex h-12 w-full items-center justify-center text-[16px] font-semibold text-primary-dark"
            >
              Cancelar
            </button>
          </section>
        </div>
      )}

      {cameraPosition && (
        <div className="fixed inset-0 z-50 bg-camera">
          <GuidedCamera
            position={cameraPosition}
            weightKg={weightKg}
            cancel={{ onClick: () => setCameraPosition(null) }}
            needsNetwork={false}
            onUse={async (shot) => {
              keep(shot, cameraPosition);
              setCameraPosition(null);
            }}
          />
        </div>
      )}
    </>
  );
}
